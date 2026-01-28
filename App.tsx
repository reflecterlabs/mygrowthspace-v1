import React, { useState, useEffect, useMemo } from 'react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { useUser, useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { jwtDecode } from 'jwt-decode';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import UserProfileModal from './src/components/UserProfileModal';
import RoutineInput from './src/components/RoutineInput';
import InsightCard from './components/InsightCard';
import { createClerkSupabaseClient } from './src/lib/supabaseClient';
import { Habit, UserProfile, SuggestedCard } from './types';
import { showSuccess, showError, showLoading, dismissToast } from './src/utils/toast';
import { generateSuggestedCards } from './services/geminiService';

const calculateStreak = (_habit: Habit, allCompletedDates: string[]): { streak: number; lastCompletedDate: string | null } => {
  const sortedDates = [...allCompletedDates].sort();
  if (sortedDates.length === 0) return { streak: 0, lastCompletedDate: null };
  const actualTodayStr = new Date().toISOString().split('T')[0];
  const relevantDates = sortedDates.filter(d => d <= actualTodayStr);
  if (relevantDates.length === 0) return { streak: 0, lastCompletedDate: null };

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0,0,0,0);
  const todayStr = checkDate.toISOString().split('T')[0];
  checkDate.setDate(checkDate.getDate() - 1);
  const yesterdayStr = checkDate.toISOString().split('T')[0];

  if (!relevantDates.includes(todayStr) && !relevantDates.includes(yesterdayStr)) {
    return { streak: 0, lastCompletedDate: relevantDates[relevantDates.length-1] };
  }

  let iterDate = relevantDates.includes(todayStr) ? new Date() : checkDate;
  while(true) {
    const dStr = iterDate.toISOString().split('T')[0];
    if (relevantDates.includes(dStr)) {
      streak++;
      iterDate.setDate(iterDate.getDate() - 1);
    } else break;
  }
  return { streak, lastCompletedDate: relevantDates[relevantDates.length-1] };
};

const App: React.FC = () => {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'onboarding' | 'ready' | 'error'>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedCard[]>([]);

  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      if (isLoaded && !isSignedIn) setProfileStatus('idle');
      return;
    }

    const initSession = async () => {
      setProfileStatus('loading');
      try {
        const token = await getToken();
        if (!token) {
          showError("Could not retrieve session token from Clerk.");
          setProfileStatus('error');
          return;
        }

        const decoded: any = jwtDecode(token);
        if (!decoded.sub || decoded.sub.startsWith('{{')) {
          showError("Invalid session token structure. Check Clerk session config.");
          setProfileStatus('error');
          return;
        }

        await (supabase as any).realtime.setAuth(token);
        
        const { data: profileData, error: pError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (pError) {
          console.error("Profile fetch error:", pError);
          setProfileStatus('error');
          return;
        }

        if (!profileData || !profileData.has_completed_onboarding) {
          setProfileStatus('onboarding');
        } else {
          setProfile({
            name: profileData.name,
            email: profileData.email,
            isPremium: profileData.is_premium,
            identityStatement: profileData.identity_statement,
            focusAreas: profileData.focus_areas,
            narrative: profileData.narrative
          });

          const { data: habitsData } = await supabase.from('habits').select('*').eq('user_id', user.id);
          setHabits((habitsData || []).map((h: any) => ({ 
            id: h.id,
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            daysOfWeek: h.days_of_week,
            time: h.time_of_day,
            streak: h.streak,
            completedDates: h.completed_dates,
            createdAt: h.created_at,
            startDate: h.start_date,
            isOneTime: h.is_one_time,
            lastCompletedDate: h.last_completed_date
          })));
          setProfileStatus('ready');
        }
      } catch (e) {
        console.error("Session init error:", e);
        setProfileStatus('error');
      }
    };

    initSession();
  }, [isLoaded, isSignedIn, user, refreshTrigger, getToken, supabase]);

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    if (!user) return;
    const toastId = showLoading('Activating protocols...');
    try {
      const { error: pErr } = await supabase.from('user_profiles').upsert({
        id: user.id, 
        name: newProfile.name,
        email: user.emailAddresses[0].emailAddress,
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        narrative: newProfile.narrative,
        has_completed_onboarding: true
      });
      
      if (pErr) throw pErr;

      if (newHabits.length > 0) {
        const habitsToInsert = newHabits.map(h => ({
          user_id: user.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          days_of_week: h.daysOfWeek,
          time_of_day: h.time,
          is_one_time: h.isOneTime
        }));
        const { error: hErr } = await supabase.from('habits').insert(habitsToInsert);
        if (hErr) throw hErr;
      }
      
      showSuccess('Onboarding complete!');
      setRefreshTrigger(t => t + 1);
    } catch (e: any) {
      showError(e.message || 'Sync failed');
      console.error("Onboarding error:", e);
    } finally { dismissToast(toastId); }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;
    const isDone = habit.completedDates.includes(date);
    const newDates = isDone ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date];
    const { streak, lastCompletedDate } = calculateStreak(habit, newDates);
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completedDates: newDates, streak, lastCompletedDate } : h));
    await supabase.from('habits').update({
      completed_dates: newDates,
      streak,
      last_completed_date: lastCompletedDate
    }).eq('id', habitId).eq('user_id', user.id);
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== habitId));
      showSuccess('Protocol terminated');
    } catch (e) {
      showError('Failed to delete');
      console.error(e);
    }
  };

  const saveHabit = async (data: Partial<Habit>) => {
    if (!user) return;
    const { data: newH } = await supabase.from('habits').insert({
      user_id: user.id,
      name: data.name,
      category: data.category,
      frequency: data.frequency || 'daily',
      days_of_week: data.daysOfWeek || [0,1,2,3,4,5,6],
      time_of_day: data.time,
      is_one_time: data.isOneTime || false,
      specific_dates: data.specificDates || []
    }).select().single();

    if (newH) {
      setHabits(prev => [...prev, {
        id: newH.id,
        name: newH.name,
        category: newH.category,
        frequency: newH.frequency,
        daysOfWeek: newH.days_of_week,
        time: newH.time_of_day,
        streak: 0,
        completedDates: [],
        createdAt: newH.created_at,
        isOneTime: newH.is_one_time,
        specificDates: newH.specific_dates
      }]);
      showSuccess('Habit added');
      setIsModalOpen(false);
    }
  };

  const handleAnalyzeRoutine = async (text: string) => {
    setIsAnalyzing(true);
    const toastId = showLoading('Neural processing...');
    try {
      const suggestions = await generateSuggestedCards(text, habits);
      setAiSuggestions(suggestions);
      if (suggestions.length > 0) {
        showSuccess('New protocols suggested');
      } else {
        showSuccess('Routine analyzed - consistency is key');
      }
    } catch (e) {
      showError('Analysis failed');
      console.error(e);
    } finally {
      setIsAnalyzing(false);
      dismissToast(toastId);
    }
  };

  const acceptAiSuggestion = async (habitData: Partial<Habit>, suggestionId: string) => {
    await saveHabit(habitData);
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const handleUpdateProfile = async (newName: string) => {
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update({ name: newName }).eq('id', user.id);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, name: newName } : null);
  };

  const handleDownloadData = () => {
    const data = { profile, habits };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-space-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Data package ready');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const token = await getToken();
    const response = await fetch('https://dtyzunvgbmnheqbubhef.supabase.co/functions/v1/delete-user', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete account');
    await signOut();
  };

  if (!isLoaded || profileStatus === 'loading') return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>;

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 mb-8 border border-cyan-500/20">
            <UserIcon size={40} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">My Growth Space</h1>
          <p className="text-slate-500 max-w-xs mb-8 font-medium">Initialize your identity-based habit protocols.</p>
          <SignInButton mode="modal">
            <button className="bg-white text-black px-12 py-5 rounded-[2rem] font-black text-lg hover:scale-105 transition-all active:scale-95 shadow-2xl">
              Establish Link
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {profileStatus === 'onboarding' ? <Onboarding onComplete={handleOnboardingComplete} /> : (
          <div className="min-h-screen bg-[#0a0a0c] text-white pb-48">
            <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-30">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Active</p>
                <h2 className="text-2xl font-black tracking-tight">{profile?.name}</h2>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(true)} 
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <UserIcon size={20} className="text-cyan-400" />
              </button>
            </nav>

            <main className="p-6 space-y-8 animate-in fade-in duration-500">
              <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
              
              {/* Sugerencias de la IA */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Neural Suggestions</h3>
                  {aiSuggestions.map(suggestion => (
                    <InsightCard 
                      key={suggestion.id} 
                      suggestion={suggestion} 
                      onAccept={(habit) => acceptAiSuggestion(habit, suggestion.id)}
                      onReject={() => setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                    />
                  ))}
                </div>
              )}

              <div className="grid gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Current Nodes</h3>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-lg border border-cyan-500/20 font-bold uppercase">
                    {habits.length} Active
                  </span>
                </div>
                {habits.map(h => (
                  <HabitCard 
                    key={h.id} 
                    habit={h} 
                    selectedDateStr={selectedDate} 
                    onToggle={toggleHabit} 
                    onDelete={deleteHabit} 
                    onEdit={() => {}} 
                  />
                ))}
                {habits.length === 0 && (
                  <div className="text-center p-16 border-2 border-dashed border-white/5 rounded-[3rem] text-slate-600">
                    <div className="flex justify-center mb-4 opacity-20"><UserIcon size={48} /></div>
                    <p className="font-bold text-sm">No operational protocols found.</p>
                    <p className="text-[10px] uppercase tracking-widest mt-2">Initialize a new node to begin.</p>
                  </div>
                )}
              </div>
            </main>

            {/* Componente de entrada flotante */}
            <RoutineInput onAnalyze={handleAnalyzeRoutine} isLoading={isAnalyzing} />

            <BottomNavBar onHomeClick={() => {}} onInsightsClick={() => {}} onAddHabitClick={() => setIsModalOpen(true)} />
            <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveHabit} />
            
            {profile && (
              <UserProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                userProfile={profile}
                onUpdateProfile={handleUpdateProfile}
                onDownloadData={handleDownloadData}
                onDeleteAccount={handleDeleteAccount}
                onLogout={async () => signOut()}
              />
            )}
          </div>
        )}
      </SignedIn>
    </>
  );
};

export default App;