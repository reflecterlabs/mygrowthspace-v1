import { GoogleGenAI, Type } from "@google/genai";
import { MotivationTip, SuggestedCard, Habit } from "../types";

// Accede a la variable de entorno usando import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno VITE_GEMINI_API_KEY no está configurada. Por favor, añádela a tu archivo .env");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getDailyInspiration = async (userFocus: string): Promise<MotivationTip> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Give me a daily motivational quote and a small actionable "atomic habit" step based on James Clear's principles for someone focusing on ${userFocus}. Return it in JSON format in English.`,
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

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (e) {
    return {
      quote: "Success is the product of daily habits.",
      author: "James Clear",
      actionStep: "Start with a habit that takes less than two minutes."
    };
  }
};

export const analyzeHabitProgress = async (habits: Habit[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Review my current habits and completion data: ${JSON.stringify(habits)}. 
    Provide a brief, motivating one-sentence insight about my progress or a constructive tip for consistency based on "Atomic Habits" principles. MUST BE IN ENGLISH.`,
  });

  return response.text || "Your consistency is the foundation of your success. Keep showing up!";
};

export const parseRoutineIntoHabits = async (narrative: string): Promise<{ habits: Partial<Habit>[], identity: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this routine narrative: "${narrative}". 
    1. Extract a list of atomic habits. For each, identify: name, category (Health, Mindset, Productivity, Finance, Social), time (HH:mm if mentioned), description, and daysOfWeek (array 0-6).
    2. Create a one-sentence "Identity Statement" (e.g. "I am a person who...") based on these actions.
    Return as JSON in English.`,
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

  const text = response.text;
  if (!text) throw new Error("Empty response");
  return JSON.parse(text);
};

export const generateSuggestedCards = async (logText: string, existingHabits: Habit[]): Promise<SuggestedCard[]> => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();
  
  const prompt = `User Input: "${logText}". Current Date Context: Today is ${todayStr}.
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
  
  const response = await ai.models.generateContent({
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
  
  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response", text);
    return [];
  }
};