import React, { useState, useEffect, useMemo } from 'react';
import { initAnalytics } from './src/analytics';
import { User as UserIcon, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useUser, useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import EditHabitModal from './components/EditHabitModal';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import UserProfileModal from './src/components/UserProfileModal';
import RoutineInput from './src/components/RoutineInput';
import ManifestHeader from './src/components/ManifestHeader';
import CategoryFilter from './src/components/CategoryFilter';
import InsightCard from './components/InsightCard';
import DailyRecommendation from './src/components/DailyRecommendation';
import FeedbackBubble from './src/components/FeedbackBubble';
import InsightsPage from './src/pages/InsightsPage';
import { createClerkSupabaseClient } from './src/lib/supabaseClient';
import { Habit, UserProfile, SuggestedCard, MotivationTip } from './types';
import { showSuccess, showError, showLoading, dismissToast } from './src/utils/toast';
import { generateSuggestedCards, getDailyInspiration } from './services/geminiService';
import { getTranslation } from './src/lib/translations';

// Helper para obtener YYYY-MM-DD en hora local real del dispositivo
const getTodayLocalStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateStreak = (_habit: Habit, allCompletedDates: string[]): { streak: number; lastCompletedDate: string | null } => {
  const sortedDates = [...allCompletedDates].sort();
  if (sortedDates.length === 0) return { streak: 0, lastCompletedDate: null };
  const actualTodayStr = getTodayLocalStr();
  const relevantDates = sortedDates.filter(d => d <= actualTodayStr);
  if (relevantDates.length === 0) return { streak: 0, lastCompletedDate: null };

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0,0,0,0);
  const todayStr = getTodayLocalStr();
  
  // Ayer en local
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth()+1).toString().padStart(2,'0')}-${yesterday.getDate().toString().padStart(2,'0')}`;

  if (!relevantDates.includes(todayStr) && !relevantDates.includes(yesterdayStr)) {
    return { streak: 0, lastCompletedDate: relevantDates[relevantDates.length-1] };
  }

  let iterDate = relevantDates.includes(todayStr) ? new Date() : yesterday;
  while(true) {
    const dStr = `${iterDate.getFullYear()}-${(iterDate.getMonth()+1).toString().padStart(2,'0')}-${iterDate.getDate().toString().padStart(2,'0')}`;
    if (relevantDates.includes(dStr)) {
      streak++;
      iterDate.setDate(iterDate.getDate() - 1);
    } else break;
  }
  return { streak, lastCompletedDate: relevantDates[relevantDates.length-1] };
};

// Inicializar analíticas al cargar el módulo principal
initAnalytics();

const App: React.FC = () => {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'onboarding' | 'ready' | 'error'>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalStr());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedCard[]>([]);
  const [dailyRecommendation, setDailyRecommendation] = useState<MotivationTip | null>(null);
  const [showDailyRecommendation, setShowDailyRecommendation] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'insights'>('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);

  const browserLang = navigator.language.split('-')[0];
  const currentLanguage = profile?.language || browserLang;
  const t = (key: any) => getTranslation(currentLanguage, key);

  const fetchDailyRecommendation = async (focusAreas: string[], lang: string) => {
    const focus = focusAreas?.join(', ') || 'personal growth';
    try {
      const tip = await getDailyInspiration(focus, lang);
      setDailyRecommendation(tip);
      setShowDailyRecommendation(true);
    } catch (e) {
      console.error("Failed to fetch recommendation", e);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      if (isLoaded && !isSignedIn) setProfileStatus('idle');
      return;
    }

    const initSession = async () => {
      setProfileStatus('loading');
      try {
        const token = await getToken();
        if (!token) return;

        const { data: profileData, error: pError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (pError) {
          setProfileStatus('error');
          return;
        }

        if (!profileData || !profileData.has_completed_onboarding) {
          setProfileStatus('onboarding');
        } else {
          const userLang = profileData.language || browserLang;
          const currentProfile: UserProfile = {
            name: profileData.name,
            email: profileData.email,
            isPremium: profileData.is_premium,
            identityStatement: profileData.identity_statement,
            focusAreas: profileData.focus_areas,
            narrative: profileData.narrative,
            themeColor: profileData.theme_color || '#06b6d4',
            language: userLang
          };
          setProfile(currentProfile);

          document.documentElement.style.setProperty('--primary-color', profileData.theme_color || '#06b6d4');

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
            specificDates: h.specific_dates,
            lastCompletedDate: h.last_completed_date
          })));
          setProfileStatus('ready');

          if (!dailyRecommendation) {
            fetchDailyRecommendation(currentProfile.focusAreas, userLang);
          }
        }
      } catch (e) {
        setProfileStatus('error');
      }
    };

    initSession();
  }, [isLoaded, isSignedIn, user, refreshTrigger, getToken, supabase, browserLang]);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.themeColor) dbUpdates.theme_color = updates.themeColor;
    if (updates.language) dbUpdates.language = updates.language;
    if (updates.identityStatement) dbUpdates.identity_statement = updates.identityStatement;
    
    await supabase.from('user_profiles').update(dbUpdates).eq('id', user.id);
    
    setProfile(prev => {
      const newProfile = prev ? { ...prev, ...updates } : null;
      if (updates.language && updates.language !== prev?.language && newProfile) {
        setDailyRecommendation(null);
        fetchDailyRecommendation(newProfile.focusAreas, updates.language);
      }
      return newProfile;
    });
  };

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    if (!user) return;
    const toastId = showLoading(t('toastActivatingProtocols'));
    const todayStr = getTodayLocalStr();
    try {
      const finalLang = newProfile.language || browserLang;
      await supabase.from('user_profiles').upsert({
        id: user.id, 
        name: newProfile.name,
        email: user.emailAddresses[0].emailAddress,
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        narrative: newProfile.narrative,
        has_completed_onboarding: true,
        theme_color: '#06b6d4',
        language: finalLang
      });
      
      if (newHabits.length > 0) {
        const habitsToInsert = newHabits.map(h => ({
          user_id: user.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          days_of_week: h.daysOfWeek,
          time_of_day: h.time,
          is_one_time: h.isOneTime,
          start_date: todayStr
        }));
        await supabase.from('habits').insert(habitsToInsert);
      }
      
      showSuccess(t('toastOnboardingComplete'));
      setRefreshTrigger(t => t + 1);
    } catch (e: any) {
      showError(e.message || 'Sync failed');
    } finally { dismissToast(toastId); }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    const todayStr = getTodayLocalStr();
    
    // Comparación basada en fecha local sin horas
    if (date < todayStr) {
      showError("Consistency is maintained in the present. Past logs are locked.");
      return;
    }

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

  const confirmDeleteHabit = async (habitId: string) => {
    if (!user) return;
    await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    showSuccess(t('toastProtocolTerminated'));
    setDeleteConfirmation(null);
  };

  const saveHabit = async (data: Partial<Habit>, suggestionId?: string) => {
    if (!user) return;
    const todayStr = getTodayLocalStr();
    const { data: newH } = await supabase.from('habits').insert({
      user_id: user.id,
      name: data.name,
      category: data.category,
      frequency: data.frequency || 'daily',
      days_of_week: data.daysOfWeek || [0,1,2,3,4,5,6],
      time_of_day: data.time,
      is_one_time: data.isOneTime || false,
      specific_dates: data.specificDates || [],
      start_date: todayStr
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
        specificDates: newH.specific_dates,
        startDate: newH.start_date
      }]);
      showSuccess(t('toastHabitDeployed'));
      setIsModalOpen(false);
      if (suggestionId) setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }
  };

  const updateExistingHabit = async (updates: Partial<Habit>) => {
    if (!editingHabit || !user) return;
    await supabase.from('habits').update({
      name: updates.name,
      category: updates.category,
      time_of_day: updates.time
    }).eq('id', editingHabit.id).eq('user_id', user.id);
    setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...updates } : h));
    showSuccess(t('toastProtocolUpdated'));
    setIsEditModalOpen(false);
    setEditingHabit(null);
  };

  const handleUpdateIdentity = async (newStatement: string) => {
    if (!user) return;
    await handleUpdateProfile({ identityStatement: newStatement });
    showSuccess("Identity manifestation updated.");
  };

  const handleAnalyzeRoutine = async (text: string) => {
    setIsAnalyzing(true);
    const toastId = showLoading(t('toastNeuralProcessing'));
    try {
      const suggestions = await generateSuggestedCards(text, habits);
      setAiSuggestions(suggestions);
      showSuccess(suggestions.length > 0 ? t('toastInsightsGenerated') : t('toastRoutineAnalyzed'));
    } catch (e) {
      showError('Analysis failed');
    } finally {
      setIsAnalyzing(false);
      dismissToast(toastId);
    }
  };

  const handleSendFeedback = async (content: string) => {
    if (!user) return;
    await supabase.from('feedback').insert({ user_id: user.id, content });
    showSuccess("Feedback enviado, ¡gracias!");
  };

  const filteredHabits = habits.filter(h => {
    const isCorrectCategory = selectedCategory === 'All' || h.category === selectedCategory;
    const isStarted = h.startDate ? selectedDate >= h.startDate : true;
    return isCorrectCategory && isStarted;
  });

  if (!isLoaded || profileStatus === 'loading') return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>;

  const clerkAppearance = {
    baseTheme: dark,
    elements: {
      formButtonPrimary: 'bg-primary-500 text-black hover:opacity-90 transition-all font-black uppercase text-xs tracking-widest py-3',
      card: 'bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] shadow-2xl',
      headerTitle: 'text-white font-black tracking-tighter text-2xl',
      headerSubtitle: 'text-slate-500 font-bold uppercase tracking-widest text-[10px]',
    }
  };

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-primary-500/10 rounded-[2.5rem] flex items-center justify-center text-primary-500 mb-8 border border-primary-500/20 shadow-2xl shadow-primary-500/10">
            <div className="w-12 h-12 border-4 border-primary-500 rounded-2xl animate-[spin_3s_linear_infinite]" style={{ borderTopColor: 'transparent' }} />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">{t('appName')}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-12">{t('syncIdentity')}</p>
          <SignInButton mode="modal" appearance={clerkAppearance}>
            <button className="bg-white text-black px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95">{t('establishLink')}</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {profileStatus === 'onboarding' ? <Onboarding onComplete={handleOnboardingComplete} /> : (
          <div className="min-h-screen bg-[#0a0a0c] text-white pb-48">
            <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-30">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('appName')}</p>
                <h2 className="text-2xl font-black tracking-tight">{profile?.name}</h2>
              </div>
              <div className="flex items-center gap-3 relative">
                <button onClick={() => setIsFeedbackOpen(!isFeedbackOpen)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 hover:text-primary-500">
                  <MessageSquare size={20} />
                </button>
                <button onClick={() => setIsProfileModalOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"><UserIcon size={20} className="text-primary-500" /></button>
                <FeedbackBubble isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} onSubmit={handleSendFeedback} language={currentLanguage} />
              </div>
            </nav>

            {currentView === 'home' ? (
              <main className="p-6 space-y-4 animate-in fade-in duration-500">
                <ManifestHeader statement={profile?.identityStatement || ''} onUpdate={handleUpdateIdentity} language={currentLanguage} />
                {showDailyRecommendation && dailyRecommendation && (
                  <DailyRecommendation recommendation={dailyRecommendation} onDismiss={() => setShowDailyRecommendation(false)} language={currentLanguage} />
                )}
                <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
                <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} language={currentLanguage} />
                {aiSuggestions.map(s => (
                  <InsightCard key={s.id} suggestion={s} onAccept={(h) => saveHabit(h, s.id)} onReject={() => setAiSuggestions(prev => prev.filter(x => x.id !== s.id))} language={currentLanguage} />
                ))}
                <div className="grid gap-3 pt-4">
                  {filteredHabits.map(h => (
                    <HabitCard key={h.id} habit={h} selectedDateStr={selectedDate} onToggle={toggleHabit} onDelete={(id) => setDeleteConfirmation(id)} onEdit={(habit) => { setEditingHabit(habit); setIsEditModalOpen(true); }} language={currentLanguage} />
                  ))}
                  {filteredHabits.length === 0 && <div className="text-center p-16 border-2 border-dashed border-white/5 rounded-[3rem] text-slate-600 font-black uppercase tracking-widest text-[10px]">No active protocols for this date.</div>}
                </div>
              </main>
            ) : (
              <main className="animate-in fade-in duration-500"><InsightsPage habits={habits} language={currentLanguage} /></main>
            )}

            <RoutineInput onAnalyze={handleAnalyzeRoutine} isLoading={isAnalyzing} language={currentLanguage} />
            <BottomNavBar currentView={currentView} onHomeClick={() => setCurrentView('home')} onInsightsClick={() => setCurrentView('insights')} onAddHabitClick={() => setIsModalOpen(true)} />
            <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveHabit} language={currentLanguage} />
            <EditHabitModal isOpen={isEditModalOpen} habit={editingHabit} onClose={() => { setIsEditModalOpen(false); setEditingHabit(null); }} onSave={updateExistingHabit} language={currentLanguage} />
            
            {deleteConfirmation && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-sm w-full text-center">
                  <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">{t('deleteHabitTitle')}</h3>
                  <p className="text-slate-400 text-xs mb-8">{t('deleteHabitDesc')}</p>
                  <div className="flex gap-4">
                    <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black">{t('cancel')}</button>
                    <button onClick={() => confirmDeleteHabit(deleteConfirmation)} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black">{t('confirm')}</button>
                  </div>
                </div>
              </div>
            )}

            {profile && (
              <UserProfileModal 
                isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} 
                userProfile={profile} onUpdateProfile={handleUpdateProfile}
                onDownloadData={() => {}} onDeleteAccount={async () => {}} onLogout={async () => signOut()}
              />
            )}
          </div>
        )}
      </SignedIn>
    </>
  );
};

export default App;