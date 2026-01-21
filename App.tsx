import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Plus, 
  Flame,
  User as UserIcon,
  LogOut,
  Loader2,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './src/components/AuthProvider';
import Login from './src/pages/Login';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';
import { generateSuggestedCards } from './services/geminiService';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickLog, setQuickLog] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (!profileData || profileError) {
        setShowOnboarding(true);
      } else {
        setProfile({
          name: profileData.name,
          email: profileData.email,
          isPremium: profileData.is_premium,
          identityStatement: profileData.identity_statement,
          focusAreas: profileData.focus_areas,
          narrative: profileData.narrative
        });

        const { data: habitsData } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user?.id);
        
        const transformedHabits: Habit[] = (habitsData || []).map(h => ({
          id: h.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          daysOfWeek: h.days_of_week || [],
          time: h.time_of_day,
          description: h.description,
          streak: h.streak || 0,
          completedDates: [],
          createdAt: h.created_at,
          startDate: h.start_date,
          isOneTime: h.is_one_time
        }));

        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from('habit_completions')
          .select('habit_id')
          .eq('user_id', user?.id)
          .eq('completed_at', today);

        const completedIds = new Set(completions?.map(c => c.habit_id));
        
        setHabits(transformedHabits.map(h => ({
          ...h,
          completedDates: completedIds.has(h.id) ? [today] : []
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLog.trim()) return;

    setIsProcessingAI(true);
    try {
      const suggestions = await generateSuggestedCards(quickLog, habits);
      if (suggestions.length > 0 && suggestions[0].suggestedAction) {
        const payload = suggestions[0].suggestedAction.payload;
        await saveHabit(payload);
        setQuickLog('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const saveHabit = async (habitData: Partial<Habit>) => {
    await supabase.from('habits').insert({
      user_id: user?.id,
      name: habitData.name,
      category: habitData.category,
      frequency: habitData.frequency || 'daily',
      days_of_week: habitData.daysOfWeek || [0,1,2,3,4,5,6],
      time_of_day: habitData.time,
      description: habitData.description,
      is_one_time: habitData.isOneTime || false,
      start_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
    fetchUserData();
  };

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    try {
      setLoading(true);
      await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        name: newProfile.name,
        email: user?.email,
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        narrative: newProfile.narrative
      });

      const habitsToInsert = newHabits.map(h => ({
        user_id: user?.id,
        name: h.name,
        category: h.category,
        frequency: h.frequency,
        days_of_week: h.daysOfWeek,
        time_of_day: h.time,
        description: h.description,
        is_one_time: h.isOneTime,
        start_date: h.startDate
      }));

      await supabase.from('habits').insert(habitsToInsert);
      setShowOnboarding(false);
      fetchUserData();
    } catch (error) {
      console.error("Error saving onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (id: string, dateStr: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(dateStr);

    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          completedDates: isCompleted 
            ? h.completedDates.filter(d => d !== dateStr) 
            : [...h.completedDates, dateStr]
        };
      }
      return h;
    }));

    if (!isCompleted) {
      await supabase.from('habit_completions').insert({
        habit_id: id,
        completed_at: dateStr,
        user_id: user?.id
      });
    } else {
      await supabase.from('habit_completions')
        .delete()
        .eq('habit_id', id)
        .eq('completed_at', dateStr)
        .eq('user_id', user?.id);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="text-cyan-400 animate-spin" size={40} /></div>;
  if (!user) return <Login />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans pb-24">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Dumbbell size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">Protocol</span>
        </div>
        
        <button onClick={() => signOut()} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={18} />
        </button>
      </nav>

      <main className="pt-28 px-6 max-w-7xl mx-auto space-y-8">
        
        {/* Quick Log Input (IA) */}
        <section className="max-w-3xl mx-auto w-full">
          <form onSubmit={handleQuickLog} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-600/50 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-1 flex items-center backdrop-blur-xl">
              <div className="pl-4 text-cyan-400">
                {isProcessingAI ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              </div>
              <input 
                type="text" 
                placeholder="Log a thought or add a habit with AI..." 
                className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-slate-700"
                value={quickLog}
                onChange={(e) => setQuickLog(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-white text-black p-3 rounded-2xl mr-1 hover:bg-cyan-500 transition-all"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </form>
        </section>

        {/* Profile */}
        <section className="relative group">
          <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center relative">
                <UserIcon size={40} className="text-white" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full border-4 border-[#0a0a0c] flex items-center justify-center">
                  <Flame size={14} />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-black text-white tracking-tight">{profile?.name}</h1>
                <p className="text-slate-400 italic text-base mt-1">"{profile?.identityStatement}"</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <Calendar className="text-cyan-400" size={20} />
              Active Protocol
            </h2>
            
            <div className="grid gap-1">
              {loading ? (
                <div className="p-12 text-center animate-pulse text-slate-700 font-black uppercase text-[10px] tracking-[0.2em]">Syncing Neural Nodes...</div>
              ) : habits.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-12 text-center space-y-4">
                  <p className="text-slate-500 font-bold">No active protocols detected.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-cyan-400 font-black uppercase text-xs tracking-widest border-b border-cyan-400/30 pb-1">Initialize First Node</button>
                </div>
              ) : (
                habits.map(habit => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    selectedDateStr={todayStr}
                    onToggle={toggleHabit}
                    onDelete={async (id) => {
                      await supabase.from('habits').delete().eq('id', id);
                      fetchUserData();
                    }}
                    onEdit={() => {}}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles size={18} />
                <h3 className="font-black uppercase tracking-widest text-[10px]">AI Insight</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Your <span className="text-cyan-400">Morning Sync</span> consistency is creating a powerful neural baseline.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* FAB Button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="pointer-events-auto w-16 h-16 bg-white text-black rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center justify-center hover:scale-110 hover:-translate-y-2 active:scale-95 transition-all group"
        >
          <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={saveHabit} 
      />
    </div>
  );
};

export default App;