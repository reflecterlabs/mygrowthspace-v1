"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Target, 
  Trophy, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle,
  Settings,
  Flame,
  User as UserIcon,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAuth } from './src/components/AuthProvider';
import Login from './src/pages/Login';
import { supabase } from './src/integrations/supabase/client';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      setProfile(profileData);

      // Fetch Habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id);
      
      setHabits(habitsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    // Local update for UI snappiness
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));

    // Persist to Supabase
    const today = new Date().toISOString().split('T')[0];
    if (!habit.completed) {
      await supabase.from('habit_completions').insert({
        habit_id: id,
        completed_at: today
      });
    } else {
      await supabase.from('habit_completions')
        .delete()
        .eq('habit_id', id)
        .eq('completed_at', today);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <Loader2 className="text-cyan-400 animate-spin" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Dynamic Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
            <Dumbbell size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">Protocol</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-slate-500 uppercase">{profile?.name || 'Explorer'}</span>
            <span className="text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase">Operator Lvl 1</span>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto space-y-12">
        {/* Profile Identity Section */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px]">
                  <div className="w-full h-full rounded-[22px] bg-[#0a0a0c] flex items-center justify-center">
                    <UserIcon size={40} className="text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full border-4 border-[#0a0a0c] flex items-center justify-center">
                  <Flame size={14} className="text-white" />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-white tracking-tight">{profile?.name || 'Loading profile...'}</h1>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Phase</span>
                </div>
                <p className="text-slate-400 font-medium text-lg italic opacity-80">
                  "{profile?.identity_statement || 'Defining current identity protocol...'}"
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(profile?.focus_areas || ['Performance', 'Discipline']).map((area: string) => (
                    <span key={area} className="px-3 py-1 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Habits Dashboard */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Calendar className="text-cyan-400" size={20} />
                Daily Protocol
              </h2>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Plus size={20} />
              </button>
            </div>

            <div className="grid gap-3">
              {loading ? (
                <div className="p-8 text-center text-slate-500 uppercase text-xs font-bold tracking-widest animate-pulse">Initializing Data Stream...</div>
              ) : habits.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center space-y-4">
                  <p className="text-slate-500 uppercase text-xs font-bold tracking-widest">No protocols established</p>
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold transition-all">
                    Create First Habit
                  </button>
                </div>
              ) : (
                habits.map((habit) => (
                  <button 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 ${
                      habit.completed 
                        ? 'bg-cyan-500/5 border-cyan-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`transition-colors duration-300 ${habit.completed ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                        {habit.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </div>
                      <div className="text-left">
                        <span className={`block font-bold text-lg transition-all ${habit.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {habit.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {habit.streak || 0} Day Streak
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
             <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 px-2">
                <Trophy className="text-cyan-400" size={20} />
                Global Stats
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Efficiency</span>
                    <span className="text-2xl font-black text-white">84%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[84%] bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Streak</span>
                    <p className="text-xl font-black text-cyan-400">12d</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</span>
                    <p className="text-xl font-black text-white">2.4k</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] group cursor-pointer hover:bg-cyan-500/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-sm">Next Evolution</h3>
                    <p className="text-[10px] font-bold text-cyan-400/80 uppercase">Complete 4 more protocols</p>
                  </div>
                  <Target size={24} className="text-cyan-400" />
                </div>
              </div>
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <button className="w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default App;