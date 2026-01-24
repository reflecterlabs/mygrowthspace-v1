import { MotivationTip, SuggestedCard, Habit } from "../types";
import { supabase } from '../src/integrations/supabase/client'; // Importar el cliente Supabase

// No necesitamos la API_KEY aquí directamente
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// if (!API_KEY) {
//   throw new Error("La variable de entorno VITE_GEMINI_API_KEY no está configurada. Por favor, añádela a tu archivo .env");
// }
// const ai = new GoogleGenAI({ apiKey: API_KEY });

const invokeGeminiProxy = async (action: string, payload: any): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action, payload },
  });

  if (error) {
    console.error(`Error invoking gemini-proxy for action ${action}:`, error);
    throw new Error(`Failed to get data from Gemini proxy: ${error.message}`);
  }
  return data;
};

export const getDailyInspiration = async (userFocus: string): Promise<MotivationTip> => {
  try {
    const result = await invokeGeminiProxy('getDailyInspiration', { userFocus });
    return result;
  } catch (e) {
    console.error("Error in getDailyInspiration:", e);
    return {
      quote: "Success is the product of daily habits.",
      author: "James Clear",
      actionStep: "Start with a habit that takes less than two minutes."
    };
  }
};

export const analyzeHabitProgress = async (habits: Habit[]): Promise<string> => {
  try {
    const result = await invokeGeminiProxy('analyzeHabitProgress', { habits });
    return result;
  } catch (e) {
    console.error("Error in analyzeHabitProgress:", e);
    return "Your consistency is the foundation of your success. Keep showing up!";
  }
};

export const parseRoutineIntoHabits = async (narrative: string): Promise<{ habits: Partial<Habit>[], identity: string }> => {
  try {
    const result = await invokeGeminiProxy('parseRoutineIntoHabits', { narrative });
    return result;
  } catch (e) {
    console.error("Error in parseRoutineIntoHabits:", e);
    return { habits: [], identity: "I am forging my new self." };
  }
};

export const generateSuggestedCards = async (logText: string, existingHabits: Habit[]): Promise<SuggestedCard[]> => {
  try {
    const result = await invokeGeminiProxy('generateSuggestedCards', { logText, existingHabits });
    return result;
  } catch (e) {
    console.error("Error in generateSuggestedCards:", e);
    return [];
  }
};