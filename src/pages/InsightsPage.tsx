import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Habit } from '../../types';
import { Flame, Loader2, TrendingUp } from 'lucide-react';

interface InsightsPageProps {
  habits: Habit[];
}

const InsightsPage: React.FC<InsightsPageProps> = ({ habits }) => {
  const { isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [groupedStreaks, setGroupedStreaks] = useState<Record<string, Habit[]>>({});

  useEffect(() => {
    if (habits.length > 0) {
      const grouped: Record<string, Habit[]> = {};
      habits.forEach(habit => {
        const category = habit.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(habit);
      });
      setGroupedStreaks(grouped);
      setLoading(false);
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [habits, isLoaded]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="text-primary-500 animate-spin" size={32} /></div>;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2 text-primary-500">
        <TrendingUp size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Neural Progress Analysis</span>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tight">System Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(groupedStreaks).length === 0 ? (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-[3rem] text-center text-slate-600 font-black uppercase tracking-widest text-xs">
            Awaiting data population...
          </div>
        ) : (
          Object.entries(groupedStreaks).map(([category, categoryHabits]) => (
            <div key={category} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4 hover:border-primary-500/30 transition-all flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-white">{category}</h3>
                <span className="text-[9px] font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20">{categoryHabits.length} NODES</span>
              </div>
              <div className="space-y-3 flex-1">
                {categoryHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="font-bold text-white text-sm">{habit.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Streak</span>
                      <span className="flex items-center text-orange-500 font-black text-lg">
                        <Flame size={16} className="mr-1" /> {habit.streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InsightsPage;