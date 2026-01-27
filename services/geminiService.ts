import { MotivationTip, SuggestedCard, Habit } from "../types";
import { supabase } from '../src/integrations/supabase/client'; // Importar el cliente Supabase

const invokeGeminiProxy = async (action: string, payload: any, retries: number = 3, delay: number = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { action, payload },
      });

      if (error) {
        // Si el error es un 503 (UNAVAILABLE) y no es el último intento, reintentar
        if (error.status === 503 && i < retries - 1) {
          console.warn(`[geminiService] Retrying action ${action} due to 503 error. Attempt ${i + 1}/${retries}.`);
          await new Promise(res => setTimeout(res, delay * (i + 1))); // Retraso exponencial
          continue; // Ir al siguiente intento
        }
        console.error(`[geminiService] Error invoking gemini-proxy for action ${action}:`, error);
        throw new Error(`Failed to get data from Gemini proxy: ${error.message}`);
      }
      return data;
    } catch (e) {
      // Si es un error de red o cualquier otro error antes de recibir una respuesta de Supabase
      if (i < retries - 1) {
        console.warn(`[geminiService] Retrying action ${action} due to network error. Attempt ${i + 1}/${retries}.`, e);
        await new Promise(res => setTimeout(res, delay * (i + 1)));
        continue;
      }
      console.error(`[geminiService] Final error invoking gemini-proxy for action ${action}:`, e);
      throw e;
    }
  }
  throw new Error(`Failed to get data from Gemini proxy after ${retries} attempts.`);
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