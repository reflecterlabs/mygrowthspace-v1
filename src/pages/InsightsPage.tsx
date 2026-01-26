import React, { useEffect, useState } from 'react';
// import { supabase } from '../integrations/supabase/client'; // Eliminado: 'supabase' no se utiliza
import { useAuth } from '../components/AuthProvider';
import { Habit } from '../../types';
import { Flame, LayoutGrid, Loader2 } from 'lucide-react';

interface InsightsPageProps {
  habits: Habit[]; // Pass habits from App.tsx
}

const InsightsPage: React.FC<InsightsPageProps> = ({ habits }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedStreaks, setGroupedStreaks] = useState<Record<string, Habit[]>>({});

  useEffect(() => {
    if (habits.length > 0) {
      const grouped: Record<string, Habit[]> = {};
      habits.forEach(habit => {
        const category = habit.category || 'Uncategorized';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(habit);
      });
      setGroupedStreaks(grouped);
      setLoading(false);
    } else if (!user) {
      setLoading(false); // No user, no habits to load
    }
  }, [habits, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-150px)]">
        <Loader2 className="text-cyan-400 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center space-x-2 text-cyan-400">
        <LayoutGrid size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Metrics Overview</span>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tight">Your Growth Patterns</h2>

      {Object.keys(groupedStreaks).length === 0 ? (
        <div className="p-12 border border-dashed border-white/10 rounded-[2.5rem] text-center text-slate-500">
          No habits to display insights for yet.
        </div>
      ) : (
        Object.entries(groupedStreaks).map(([category, categoryHabits]) => (
          <div key={category} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">{category}</h3>
            <div className="grid gap-4">
              {categoryHabits.map(habit => (
                <div key={habit.id} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl">
                  <span className="font-medium text-white">{habit.name}</span>
                  <span className="flex items-center text-orange-500 font-bold">
                    <Flame size={16} className="mr-1" /> {habit.streak}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default InsightsPage;