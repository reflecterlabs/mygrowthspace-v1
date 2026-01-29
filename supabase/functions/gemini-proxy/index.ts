// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_CATEGORIES = ['Health', 'Mindset', 'Productivity', 'Finance', 'Social'];

const getLanguageName = (code: string) => {
  const langs: Record<string, string> = {
    'es': 'Spanish',
    'en': 'English',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'hi': 'Hindi',
    'zh': 'Chinese'
  };
  return langs[code] || 'English';
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log("[gemini-proxy] Received action:", action, "with payload:", payload);

    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const langCode = payload.language || 'en';
    const langName = getLanguageName(langCode);

    let result;
    switch (action) {
      case 'getDailyInspiration':
        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a daily motivational quote and a small actionable "atomic habit" step based on James Clear's principles for someone focusing on ${payload.userFocus}. 
            
            LANGUAGE RULES (NON-NEGOTIABLE):
            - You MUST return the response entirely in ${langName}.
            - The 'quote' and 'actionStep' MUST be in ${langName}.
            - Do NOT return English text if the language is not English.
            - Return the response in JSON format.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  author: { type: Type.STRING },
                  actionStep: { type: Type.STRING }
                },
                required: ["quote", "author", "actionStep"]
              }
            }
          });
          result = JSON.parse(result.text || '{}');
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in getDailyInspiration:", geminiError);
          throw geminiError;
        }
        break;

      case 'analyzeHabitProgress':
        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Review these habits: ${JSON.stringify(payload.habits)}. 
            Provide a brief, motivating one-sentence insight or constructive tip in ${langName}. 
            CRITICAL: The entire response must be in ${langName}.`,
          });
          result = result.text;
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in analyzeHabitProgress:", geminiError);
          throw geminiError;
        }
        break;

      case 'parseRoutineIntoHabits':
        try {
          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this routine: "${payload.narrative}". 
            1. Extract habits (name, category: ${ALLOWED_CATEGORIES.join(', ')}, time HH:mm, description, daysOfWeek 0-6).
            2. Create a one-sentence "Identity Statement" (e.g. "I am a person who...").
            
            CRITICAL: The 'name', 'description', and 'identity' MUST be in the same language as the input narrative. 
            Return JSON.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  habits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ALLOWED_CATEGORIES },
                        time: { type: Type.STRING },
                        description: { type: Type.STRING },
                        daysOfWeek: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                      },
                      required: ["name", "category", "daysOfWeek"]
                    }
                  },
                  identity: { type: Type.STRING }
                },
                required: ["habits", "identity"]
              }
            }
          });
          result = JSON.parse(geminiResponse.text || '{}');
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in parseRoutineIntoHabits:", geminiError);
          throw geminiError;
        }
        break;

      case 'generateSuggestedCards':
        const currentYear = new Date().getFullYear();
        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `User Input: "${payload.logText}". 
            Task: Suggest optimizations or NEW habits. 
            CRITICAL: Identify the input language and return ALL text (title, description, actionLabel, payload.name) in THAT SAME LANGUAGE.
            
            Rules:
            - Categories: ${ALLOWED_CATEGORIES.join(', ')}.
            - For specific one-time dates (year ${currentYear}): set frequency 'one-time', isOneTime true, specificDates ["YYYY-MM-DD"].
            
            Return JSON array of SuggestedCard.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    actionLabel: { type: Type.STRING },
                    suggestedAction: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        payload: { 
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            category: { type: Type.STRING, enum: ALLOWED_CATEGORIES },
                            frequency: { type: Type.STRING, enum: ['daily', 'weekly', 'one-time'] },
                            daysOfWeek: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                            specificDates: { type: Type.ARRAY, items: { type: Type.STRING } },
                            isOneTime: { type: Type.BOOLEAN },
                            time: { type: Type.STRING },
                            description: { type: Type.STRING }
                          },
                          required: ["name", "category"]
                        }
                      },
                      required: ["type", "payload"]
                    }
                  },
                  required: ["id", "title", "description", "type", "actionLabel", "suggestedAction"]
                }
              }
            }
          });
          result = JSON.parse(result.text || '[]');
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in generateSuggestedCards:", geminiError);
          throw geminiError;
        }
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});