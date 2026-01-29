// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.38.0";
import { Opik } from "https://esm.sh/opik@0.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_CATEGORIES = ['Health', 'Mindset', 'Productivity', 'Finance', 'Social'];

// Inicializar Opik para rastrear llamadas a Gemini
function getOpikClient() {
  const apiKey = Deno.env.get('OPIK_API_KEY');
  const projectName = Deno.env.get('OPIK_PROJECT_NAME');
  const workspaceName = Deno.env.get('OPIK_WORKSPACE_NAME');
  const urlOverride = Deno.env.get('OPIK_URL_OVERRIDE');

  if (apiKey && projectName && workspaceName) {
    return new Opik({
      apiKey,
      apiUrl: urlOverride || 'https://www.comet.com/opik/api',
      projectName,
      workspaceName,
    });
  }
  return null;
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const opik = getOpikClient();
  let trace: any = null;
  const startTime = Date.now();

  try {
    const { action, payload } = await req.json();
    console.log("[gemini-proxy] Received action:", action);

    // Crear traza en Opik para esta llamada a Gemini
    if (opik) {
      trace = opik.trace({
        name: `Gemini: ${action}`,
        input: {
          action,
          language: payload.language || 'en',
          // No incluyas datos sensibles completos, solo metadatos
          hasUserFocus: !!payload.userFocus,
          hasHabits: !!payload.habits,
          narrativeLength: payload.narrative ? payload.narrative.length : 0,
          logTextLength: payload.logText ? payload.logText.length : 0,
        },
      });
    }

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
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    switch (action) {
      case 'getDailyInspiration':
        try {
          const prompt = `LANGUAGE INSTRUCTION: You MUST speak in ${langName} (${langCode}).
          
          Generate a daily motivational quote and a small actionable "atomic habit" step based on James Clear's principles for someone focusing on ${payload.userFocus}. 
          
          RULES:
          - Return only JSON.
          - The fields 'quote' and 'actionStep' MUST be in ${langName}.
          - Do NOT use English if the requested language is ${langName}.`;

          const genResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
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
          result = JSON.parse(genResult.response.text() || '{}');
        } catch (e) {
          console.error("[gemini-proxy] Error:", e);
          throw e;
        }
        break;

      case 'analyzeHabitProgress':
        const analysisPrompt = `Analyze these habits: ${JSON.stringify(payload.habits)}. 
        Provide a brief, motivating one-sentence tip.
        CRITICAL: The entire response MUST be in ${langName}.`;
        
        const analysisResult = await model.generateContent(analysisPrompt);
        result = analysisResult.response.text();
        break;

      case 'parseRoutineIntoHabits':
        const parsePrompt = `Analyze this routine: "${payload.narrative}". 
        1. Extract habits (name, category, time HH:mm, description, daysOfWeek 0-6).
        2. Create an "Identity Statement".
        3. Detect the language code of the input (e.g. 'es', 'en', 'pt').
        
        CRITICAL: All generated content must match the input language.`;

        const parseResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: parsePrompt }] }],
          generationConfig: {
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
                identity: { type: Type.STRING },
                detectedLanguage: { type: Type.STRING }
              },
              required: ["habits", "identity", "detectedLanguage"]
            }
          }
        });
        result = JSON.parse(parseResult.response.text() || '{}');
        break;

      case 'generateSuggestedCards':
        const suggestPrompt = `User Input: "${payload.logText}". 
        Suggest NEW habits or optimizations based on this input.
        CRITICAL: Return EVERYTHING in the same language as the input.`;

        const suggestResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: suggestPrompt }] }],
          generationConfig: {
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
                          frequency: { type: Type.STRING },
                          daysOfWeek: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                          time: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        result = JSON.parse(suggestResult.response.text() || '[]');
        break;

      default:
        return new Response("Unknown action", { status: 400, headers: corsHeaders });
    }

    // Registrar resultado exitoso en Opik
    const latency = Date.now() - startTime;
    if (trace) {
      trace.output = {
        status: 'success',
        action,
        latencyMs: latency,
        resultType: Array.isArray(result) ? 'array' : typeof result,
      };
      trace.end();
      await opik.flush(); // Enviar trazas a Opik
    }

    console.log(`[gemini-proxy] Action '${action}' completed in ${latency}ms`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // Registrar error en Opik
    const latency = Date.now() - startTime;
    if (trace) {
      trace.output = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        latencyMs: latency,
      };
      trace.end();
      const opik = getOpikClient();
      if (opik) {
        await opik.flush();
      }
    }

    console.error("[gemini-proxy-error]", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});