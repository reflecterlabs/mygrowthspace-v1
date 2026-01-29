import { MotivationTip, SuggestedCard, Habit } from "../types";
import { supabase } from '../src/integrations/supabase/client';

const invokeGeminiProxy = async (action: string, payload: any, retries: number = 3, delay: number = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { action, payload },
      });

      if (error) {
        if (error.status && error.status >= 500 && i < retries - 1) {
          await new Promise(res => setTimeout(res, delay * (i + 1)));
          continue;
        }
        throw new Error(`Failed to get data from Gemini proxy: ${error.message}`);
      }
      return data;
    } catch (e) {
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Failed to get data from Gemini proxy after ${retries} attempts.`);
};

export const getDailyInspiration = async (userFocus: string, language: string = 'en'): Promise<MotivationTip> => {
  try {
    const result = await invokeGeminiProxy('getDailyInspiration', { userFocus, language });
    return result;
  } catch (e) {
    return {
      quote: language === 'es' ? "El éxito es el producto de los hábitos diarios." : "Success is the product of daily habits.",
      author: "James Clear",
      actionStep: language === 'es' ? "Comienza con un hábito que tome menos de dos minutos." : "Start with a habit that takes less than two minutes."
    };
  }
};

export const analyzeHabitProgress = async (habits: Habit[], language: string = 'en'): Promise<string> => {
  try {
    const result = await invokeGeminiProxy('analyzeHabitProgress', { habits, language });
    return result;
  } catch (e) {
    return language === 'es' 
      ? "Tu consistencia es la base de tu éxito. ¡Sigue adelante!" 
      : "Your consistency is the foundation of your success. Keep showing up!";
  }
};

export const parseRoutineIntoHabits = async (narrative: string): Promise<{ habits: Partial<Habit>[], identity: string, detectedLanguage?: string }> => {
  try {
    const result = await invokeGeminiProxy('parseRoutineIntoHabits', { narrative });
    return result;
  } catch (e) {
    return { habits: [], identity: "I am forging my new self." };
  }
};

export const generateSuggestedCards = async (logText: string, existingHabits: Habit[]): Promise<SuggestedCard[]> => {
  try {
    const result = await invokeGeminiProxy('generateSuggestedCards', { logText, existingHabits });
    return result;
  } catch (e) {
    return [];
  }
};