// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_CATEGORIES = ['Health', 'Mindset', 'Productivity', 'Finance', 'Social']; // Definir categorías permitidas

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
      console.error("[gemini-proxy] GEMINI_API_KEY is not set in environment variables.");
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    let result;
    switch (action) {
      case 'getDailyInspiration':
        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Give me a daily motivational quote and a small actionable "atomic habit" step based on James Clear's principles for someone focusing on ${payload.userFocus}. Return it in JSON format in English.`,
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
          console.error("[gemini-proxy] Error in getDailyInspiration Gemini call:", geminiError);
          throw geminiError; // Re-throw to be caught by outer try-catch
        }
        break;

      case 'analyzeHabitProgress':
        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Review my current habits and completion data: ${JSON.stringify(payload.habits)}. 
            Provide a brief, motivating one-sentence insight about my progress or a constructive tip for consistency based on "Atomic Habits" principles. MUST BE IN ENGLISH.`,
          });
          result = result.text;
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in analyzeHabitProgress Gemini call:", geminiError);
          throw geminiError;
        }
        break;

      case 'parseRoutineIntoHabits':
        const parseRoutinePrompt = `Analyze this routine narrative: "${payload.narrative}". 
          First, identify the language of the narrative.
          1. Extract a list of atomic habits. For each, identify: name, category (MUST be one of: ${ALLOWED_CATEGORIES.join(', ')}), time (HH:mm if mentioned), description, and daysOfWeek (array 0-6).
          2. Create a one-sentence "Identity Statement" (e.g. "I am a person who...") based on these actions.
          Return all habit details and the identity statement in the identified language, in JSON format.`;
        
        console.log("[gemini-proxy] Sending prompt to Gemini for parseRoutineIntoHabits:", parseRoutinePrompt);

        try {
          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: parseRoutinePrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: { // Restaurado el responseSchema
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
          
          const rawGeminiText = geminiResponse.text;
          console.log("[gemini-proxy] Raw Gemini response for parseRoutineIntoHabits:", rawGeminiText);

          try {
            result = JSON.parse(rawGeminiText || '{}');
            console.log("[gemini-proxy] Parsed Gemini response for parseRoutineIntoHabits:", result);
          } catch (jsonError) {
            console.error("[gemini-proxy] JSON parsing error for parseRoutineIntoHabits:", jsonError);
            result = { habits: [], identity: "I am forging my new self." }; // Fallback
          }
        } catch (geminiError) {
          console.error("[gemini-proxy] Error in parseRoutineIntoHabits Gemini call:", geminiError);
          throw geminiError; // Re-throw to be caught by outer try-catch
        }
        break;

      case 'generateSuggestedCards':
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentYear = today.getFullYear();
        
        const prompt = `User Input: "${payload.logText}". Current Date Context: Today is ${todayStr}.
        Task: Suggest specific "Atomic Habit" optimizations or NEW scheduled events/habits.
        First, identify the language of the user input. Then, return all suggested card details (title, description, actionLabel, and habit payload details) in the identified language.
        
        CRITICAL SCHEDULING RULES:
        - If user mentions a specific date like "Feb 5", "tomorrow", or "next Friday", or a specific event, calculate that date precisely for the year ${currentYear}.
        - For specific events (meetings, visits, appointments) or single-day habits:
          * ALWAYS set 'isOneTime': true
          * ALWAYS set 'frequency': 'one-time'
          * ALWAYS set 'specificDates': ["YYYY-MM-DD"] with the calculated date.
          * ALWAYS set 'daysOfWeek': [] (empty array).
          * Set 'type' of suggestedAction to 'create_habit'.
        - For recurring habits:
          * set 'isOneTime': false
          * set 'frequency': 'daily' or 'weekly'
          * set 'daysOfWeek': [0-6] based on the pattern.
          * 'specificDates' should be an empty array.
        
        Return as JSON array of SuggestedCard. The suggestedAction.type MUST be 'create_habit'.
        
        IMPORTANT: For habit categories, ONLY use one of these exact values: ${ALLOWED_CATEGORIES.join(', ')}.`;

        try {
          result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
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
                        type: { type: Type.STRING, description: "Must be 'create_habit'" },
                        payload: { 
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            category: { type: Type.STRING, enum: ALLOWED_CATEGORIES },
                            frequency: { type: Type.STRING, enum: ['daily', 'weekly', 'one-time'] }, // <--- Modificado aquí
                            daysOfWeek: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                            specificDates: { type: Type.ARRAY, items: { type: Type.STRING } },
                            isOneTime: { type: Type.BOOLEAN },
                            time: { type: Type.STRING },
                            description: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING }
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
          console.error("[gemini-proxy] Error in generateSuggestedCards Gemini call:", geminiError);
          throw geminiError;
        }
        break;

      default:
        console.warn("[gemini-proxy] Unknown action:", action);
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
    console.error("[gemini-proxy] General error processing request:", (error as Error).message, error); // Log full error object
    return new Response(JSON.stringify({ error: (error as Error).message || "An unknown error occurred in the proxy function." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});