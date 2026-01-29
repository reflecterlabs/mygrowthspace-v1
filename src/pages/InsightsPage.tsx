import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Habit } from '../../types';
import { Flame, Loader2, TrendingUp } from 'lucide-react';
import CategoryFilter from '../components/CategoryFilter';
import { getTranslation } from '../lib/translations';

interface InsightsPageProps {
  habits: Habit[];
  language?: string;
}

const InsightsPage: React.FC<InsightsPageProps> = ({ habits, language = 'en' }) => {
  const { isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [groupedStreaks, setGroupedStreaks] = useState<Record<string, Habit[]>>({});
  
  const t = (key: any) => getTranslation(language, key);

  useEffect(() => {
    if (isLoaded) {
      const grouped: Record<string, Habit[]> = {};
      const filteredHabits = habits.filter(h => selectedCategory === 'All' || h.category === selectedCategory);
      
      filteredHabits.forEach(habit => {
        const category = habit.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(habit);
      });
      
      setGroupedStreaks(grouped);
      setLoading(false);
    }
  }, [habits, isLoaded, selectedCategory]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="text-primary-500 animate-spin" size={32} /></div>;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-primary-500">
            <TrendingUp size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('insightsNeural')}</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t('insightsTitle')}</h2>
        </div>
      </div>

      <div className="sticky top-20 z-20 pt-2 pb-0 bg-[#0a0a0c]/90 backdrop-blur-md -mx-6 px-6">
        <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} language={language} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pb-20">
        {Object.keys(groupedStreaks).length === 0 ? (
          <div className="col-span-full p-20 border-2 border-dashed border-white/5 rounded-[3rem] text-center text-slate-600 font-black uppercase tracking-widest text-xs">
            {t('insightsAwaiting')}
          </div>
        ) : (
          Object.entries(groupedStreaks).map(([category, categoryHabits]) => (
            <div key={category} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4 hover:border-primary-500/30 transition-all flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-white">{t(category.toLowerCase() as any)}</h3>
                <span className="text-[9px] font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20">{categoryHabits.length} {t('insightsNodes')}</span>
              </div>
              <div className="space-y-3 flex-1">
                {categoryHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="font-bold text-white text-sm">{habit.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{t('habitStreak')}</span>
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