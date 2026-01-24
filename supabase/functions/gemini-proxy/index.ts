// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => { // req tipado como 'any'
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json(); // Movido al inicio del bloque try
    console.log("[gemini-proxy] Received action:", action, "with payload:", payload);

    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); // Ignorando 'Deno'
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
        break;

      case 'analyzeHabitProgress':
        result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Review my current habits and completion data: ${JSON.stringify(payload.habits)}. 
          Provide a brief, motivating one-sentence insight about my progress or a constructive tip for consistency based on "Atomic Habits" principles. MUST BE IN ENGLISH.`,
        });
        result = result.text;
        break;

      case 'parseRoutineIntoHabits':
        const parseRoutinePrompt = `Analyze this routine narrative: "${payload.narrative}". 
          1. Extract a list of atomic habits. For each, identify: name, category (Health, Mindset, Productivity, Finance, Social), time (HH:mm if mentioned), description, and daysOfWeek (array 0-6).
          2. Create a one-sentence "Identity Statement" (e.g. "I am a person who...") based on these actions.
          Return as JSON in English.`;
        
        console.log("[gemini-proxy] Sending prompt to Gemini for parseRoutineIntoHabits:", parseRoutinePrompt);

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: parseRoutinePrompt,
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
                      category: { type: Type.STRING },
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
        break;

      case 'generateSuggestedCards':
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentYear = today.getFullYear();
        
        const prompt = `User Input: "${payload.logText}". Current Date Context: Today is ${todayStr}.
        Task: Suggest specific "Atomic Habit" optimizations or NEW scheduled events/habits. Return results in English.
        
        CRITICAL SCHEDULING RULES:
        - If user mentions a specific date like "Feb 5", "tomorrow", or "next Friday", calculate that date precisely for the year ${currentYear}.
        - For specific events (meetings, visits, appointments):
          * ALWAYS set 'isOneTime': true
          * ALWAYS set 'specificDates': ["YYYY-MM-DD"] with the calculated date.
          * ALWAYS set 'daysOfWeek': [] (empty array).
          * Set 'type' of suggestedAction to 'create_habit'.
        - For recurring habits:
          * set 'isOneTime': false
          * set 'daysOfWeek': [0-6] based on the pattern.
        
        Return as JSON array of SuggestedCard. The suggestedAction.type MUST be 'create_habit'.`;

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
                          category: { type: Type.STRING },
                          frequency: { type: Type.STRING },
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
    console.error("[gemini-proxy] Error processing request:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { // Aserción de tipo para 'error.message'
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});