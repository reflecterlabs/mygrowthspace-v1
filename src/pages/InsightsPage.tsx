import React, { useEffect, useState } from 'react';
import { Habit } from '../../types';
import { Flame, LayoutGrid, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { analyzeHabitProgress } from '../../services/geminiService';

interface InsightsPageProps {
  habits: Habit[];
}

const InsightsPage: React.FC<InsightsPageProps> = ({ habits }) => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
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
      
      // Lanzar análisis de IA si no existe uno
      if (!aiInsight) {
        handleAnalyzeProgress();
      }
    } else {
      setLoading(false);
    }
  }, [habits]);

  const handleAnalyzeProgress = async () => {
    if (habits.length === 0) return;
    setAnalyzing(true);
    try {
      const insight = await analyzeHabitProgress(habits);
      setAiInsight(insight);
    } catch (e) {
      console.error("AI Analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="text-cyan-400 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center space-x-2 text-cyan-400">
        <LayoutGrid size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Metrics Overview</span>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tight">Your Growth Patterns</h2>

      {/* AI Insight Card */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles size={120} className="text-cyan-400" />
        </div>
        
        <div className="flex items-center space-x-2 text-cyan-400 mb-4">
          <Sparkles size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Neural Intelligence Analysis</span>
        </div>
        
        {analyzing ? (
          <div className="flex items-center space-x-3 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <p className="text-sm font-medium italic">Processing behavioral patterns...</p>
          </div>
        ) : (
          <p className="text-white text-lg font-bold leading-relaxed relative z-10">
            {aiInsight || "Synchronize more data to generate behavioral insights."}
          </p>
        )}
      </div>

      {Object.keys(groupedStreaks).length === 0 ? (
        <div className="p-12 border border-dashed border-white/10 rounded-[2.5rem] text-center text-slate-500">
          No habits to display insights for yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-slate-500">
            <TrendingUp size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Vector Consistency</span>
          </div>
          
          <div className="grid gap-6">
            {Object.entries(groupedStreaks).map(([category, categoryHabits]) => (
              <div key={category} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black text-white uppercase tracking-tighter">{category}</h3>
                  <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded-lg">
                    {categoryHabits.length} NODES
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {categoryHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between bg-black/40 p-5 rounded-3xl border border-white/5 transition-all hover:border-cyan-500/30 group">
                      <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{habit.name}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-600 uppercase">Streak</span>
                          <span className="flex items-center text-orange-500 font-black text-lg">
                            <Flame size={16} className="mr-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" /> 
                            {habit.streak}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;