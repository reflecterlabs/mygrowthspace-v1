export interface Habit {
  id: string;
  name: string;
  category: 'Health' | 'Mindset' | 'Productivity' | 'Finance' | 'Social';
  frequency: 'daily' | 'weekly' | 'one-time';
  daysOfWeek: number[]; 
  time?: string; 
  description?: string;
  streak: number;
  completedDates: string[]; 
  createdAt: string;
  startDate?: string;
  endDate?: string;
  specificDates?: string[];
  isOneTime?: boolean;
  lastCompletedDate?: string | null;
}

export interface UserProfile {
  name: string;
  email: string;
  isPremium: boolean;
  identityStatement: string;
  focusAreas: string[];
  narrative?: string;
  themeColor?: string;
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