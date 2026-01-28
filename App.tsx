import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { useUser, useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import UserProfileModal from './src/components/UserProfileModal';
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';
import { showSuccess, showError, showLoading, dismissToast } from './src/utils/toast';
import CreateWallet from './components/CreateWallet';
import Transfer from './components/Transfer';

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      if (isLoaded && !isSignedIn) setProfileStatus('idle');
      return;
    }

    const initSession = async () => {
      setProfileStatus('loading');
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error("No token");

        await supabase.auth.setSession({ access_token: token, refresh_token: token });
        
        const { data: profileData, error: pError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (pError) throw pError;

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
          setHabits((habitsData || []).map(h => ({
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
  }, [isLoaded, isSignedIn, user, refreshTrigger, getToken]);

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
        await supabase.from('habits').insert(newHabits.map(h => ({
          user_id: user.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          days_of_week: h.daysOfWeek,
          time_of_day: h.time,
          is_one_time: h.isOneTime
        })));
      }
      showSuccess('Onboarding complete!');
      setRefreshTrigger(t => t + 1);
    } catch (e) {
      showError('Sync failed');
      console.error(e);
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

  const saveHabit = async (data: Partial<Habit>) => {
    if (!user) return;
    const { data: newH } = await supabase.from('habits').insert({
      user_id: user.id,
      name: data.name,
      category: data.category,
      frequency: data.frequency || 'daily',
      days_of_week: data.daysOfWeek || [0,1,2,3,4,5,6],
      time_of_day: data.time,
      is_one_time: data.isOneTime || false
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
        isOneTime: newH.is_one_time
      }]);
      showSuccess('Habit added');
      setIsModalOpen(false);
    }
  };

  if (!isLoaded || profileStatus === 'loading') return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>;

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-black text-white mb-8">Growth Space</h1>
          <SignInButton mode="modal">
            <button className="bg-cyan-500 text-black px-8 py-4 rounded-2xl font-black">Get Started</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {profileStatus === 'onboarding' ? <Onboarding onComplete={handleOnboardingComplete} /> : (
          <div className="min-h-screen bg-[#0a0a0c] text-white pb-32">
            <nav className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">System Operator</p>
                <h2 className="text-2xl font-black">{profile?.name}</h2>
              </div>
              <button onClick={() => setIsProfileModalOpen(true)} className="p-2 border border-white/10 rounded-xl"><UserIcon size={20}/></button>
            </nav>

            <main className="p-6 space-y-8">
              <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
              
              <div className="grid gap-3">
                {habits.map(h => (
                  <HabitCard 
                    key={h.id} 
                    habit={h} 
                    selectedDateStr={selectedDate} 
                    onToggle={toggleHabit} 
                    onDelete={() => {}} 
                    onEdit={() => {}} 
                  />
                ))}
              </div>

              <div className="mt-12 space-y-6">
                <CreateWallet />
                <Transfer />
              </div>
            </main>

            <BottomNavBar onHomeClick={() => {}} onInsightsClick={() => {}} onAddHabitClick={() => setIsModalOpen(true)} />
            <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveHabit} />
            
            {profile && (
              <UserProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                userProfile={profile}
                onUpdateProfile={async (_n) => {}}
                onDownloadData={() => {}}
                onDeleteAccount={async () => {}}
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