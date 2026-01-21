import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Trophy, 
  Plus, 
  Flame,
  User as UserIcon,
  LogOut,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from './src/components/AuthProvider';
import Login from './src/pages/Login';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        
        // Transformar datos de Supabase al tipo Habit de la app
        const transformedHabits: Habit[] = (habitsData || []).map(h => ({
          id: h.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          daysOfWeek: h.days_of_week || [],
          time: h.time_of_day,
          description: h.description,
          streak: h.streak || 0,
          completedDates: [], // Cargaremos las completadas después
          createdAt: h.created_at,
          startDate: h.start_date,
          isOneTime: h.is_one_time
        }));

        // Cargar completados de hoy
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

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    try {
      setLoading(true);
      
      // 1. Guardar Perfil
      await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        name: newProfile.name,
        email: user?.email,
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        narrative: newProfile.narrative
      });

      // 2. Guardar Hábitos
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

    // Optimistic UI update
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
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <Dumbbell size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">Protocol</span>
        </div>
        
        <button onClick={() => signOut()} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={18} />
        </button>
      </nav>

      <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto space-y-12">
        {/* Profile Card */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2.5rem] blur opacity-10"></div>
          <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center relative">
                <UserIcon size={40} className="text-white" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full border-4 border-[#0a0a0c] flex items-center justify-center">
                  <Flame size={14} />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-black text-white tracking-tight">{profile?.name}</h1>
                <p className="text-slate-400 italic text-lg mt-1">"{profile?.identityStatement}"</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  {profile?.focusAreas.map(area => (
                    <span key={area} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400 uppercase">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <Calendar className="text-cyan-400" size={20} />
              Daily Protocol
            </h2>
            
            <div className="grid gap-1">
              {loading ? (
                <div className="p-8 text-center animate-pulse text-slate-500 font-bold uppercase text-xs">Syncing nodes...</div>
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
                <h3 className="font-black uppercase tracking-widest text-xs">AI Insights</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your consistency in <span className="text-cyan-400">Health</span> is trending upward. Maintain the morning sync to reach Level 2.
              </p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-orange-500 uppercase">Current Streak</span>
                <Flame size={20} className="text-orange-500" />
              </div>
              <p className="text-4xl font-black text-white">12 <span className="text-sm font-bold text-slate-500">DAYS</span></p>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-8 right-8">
        <button className="w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default App;