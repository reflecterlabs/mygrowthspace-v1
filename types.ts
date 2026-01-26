export interface Habit {
  id: string;
  name: string;
  category: 'Health' | 'Mindset' | 'Productivity' | 'Finance' | 'Social';
  frequency: 'daily' | 'weekly' | 'one-time'; // Añadido 'one-time'
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  time?: string; // HH:mm format
  description?: string;
  streak: number;
  completedDates: string[]; // ISO Strings (YYYY-MM-DD)
  createdAt: string;
  // New fields for exact scheduling
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  specificDates?: string[]; // Array of YYYY-MM-DD strings
  isOneTime?: boolean;
  lastCompletedDate?: string | null; // Añadido para consistencia
}

export interface UserProfile {
  name: string;
  email: string;
  isPremium: boolean;
  identityStatement: string;
  focusAreas: string[];
  narrative?: string;
}

export interface MotivationTip {
  quote: string;
  author: string;
  actionStep: string;
}

export interface SuggestedCard {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'schedule' | 'priority';
  actionLabel: string;
  suggestedAction?: {
    type: 'create_habit' | 'modify_habit';
    payload: any;
  };
}