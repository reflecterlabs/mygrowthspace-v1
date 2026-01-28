import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Loader2,
  Zap,
  RotateCcw,
  SendHorizonal,
} from 'lucide-react';
import { useUser, useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import InsightCard from './components/InsightCard';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import UserProfileModal from './src/components/UserProfileModal';
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';
import { generateSuggestedCards } from './services/geminiService';
import InsightsPage from './src/pages/InsightsPage';
import { showSuccess, showError, showLoading, dismissToast } from './src/utils/toast';
import CreateWallet from './components/CreateWallet';
import Transfer from './components/Transfer';

// Helper function for streak calculation (moved outside component for reusability)
const calculateStreak = (habit: Habit, allCompletedDates: string[]): { streak: number; lastCompletedDate: string | null } => {
  const sortedDates = [...allCompletedDates].sort();
  if (sortedDates.length === 0) {
    return { streak: 0, lastCompletedDate: null };
  }

  if (habit.isOneTime) {
    const targetDate = habit.specificDates?.[0];
    if (targetDate && sortedDates.includes(targetDate)) {
      return { streak: 1, lastCompletedDate: targetDate };
    }
    return { streak: 0, lastCompletedDate: null };
  }

  if (habit.frequency === 'daily') {
    let currentStreak = 0;
    let streakEndsOnDate: string | null = null;

    const actualToday = new Date();
    actualToday.setHours(0, 0, 0, 0);
    const actualTodayStr = actualToday.toISOString().split('T')[0];

    const relevantCompletedDates = sortedDates.filter(date => date <= actualTodayStr);

    if (relevantCompletedDates.length === 0) {
      return { streak: 0, lastCompletedDate: null };
    }

    let checkDate = new Date(actualToday);
    checkDate.setHours(0, 0, 0, 0);

    if (relevantCompletedDates.includes(actualTodayStr)) {
      currentStreak++;
      streakEndsOnDate = actualTodayStr;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (relevantCompletedDates.includes(yesterdayStr)) {
        currentStreak++;
        streakEndsOnDate = yesterdayStr;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        return { streak: 0, lastCompletedDate: relevantCompletedDates[relevantCompletedDates.length - 1] };
      }
    }

    while (true) {
      const currentCheckDateStr = checkDate.toISOString().split('T')[0];
      if (relevantCompletedDates.includes(currentCheckDateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { streak: currentStreak, lastCompletedDate: streakEndsOnDate };
  }

  return { streak: 0, lastCompletedDate: sortedDates[sortedDates.length - 1] || null };
};


const App: React.FC = () => {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'onboarding' | 'ready' | 'error'>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickLog, setQuickLog] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [editingStatement, setEditingStatement] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'insights'>('home');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null); // Estado para el ID de usuario de Supabase (TEXT)

  // --- Funciones de manejo de datos y eventos ---

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLog.trim()) return;

    setIsProcessingAI(true);
    const toastId = showLoading('Analyzing input...');
    try {
      const aiSuggestions = await generateSuggestedCards(quickLog, habits);
      setSuggestions(aiSuggestions);
      showSuccess('Suggestions generated!');
      setQuickLog('');
    } catch (err) {
      showError('Failed to generate suggestions.');
      console.error("App: AI Error en handleQuickLog:", err);
    } finally {
      dismissToast(toastId);
      setIsProcessingAI(false);
    }
  };

  const saveHabit = async (habitData: Partial<Habit>) => {
    if (!habitData.name || !supabaseUserId) return;
    const toastId = showLoading('Deploying protocol...');
    try {
      const { data: existing, error: selectErr } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', supabaseUserId)
        .eq('name', habitData.name)
        .maybeSingle();

      if (selectErr) console.error('App: Error checking existing habit:', selectErr);

      if (existing) {
        showError('A habit with this name already exists.');
        setSuggestions(prev => prev.filter(s => s.suggestedAction?.payload?.name !== habitData.name));
        dismissToast(toastId);
        return;
      }

      const { data: newHabitData, error: insertError } = await supabase.from('habits').insert({
        user_id: supabaseUserId,
        name: habitData.name,
        category: habitData.category,
        frequency: habitData.isOneTime ? 'one-time' : (habitData.frequency || 'daily'),
        days_of_week: habitData.daysOfWeek || (habitData.isOneTime ? [] : [0,1,2,3,4,5,6]),
        time_of_day: habitData.time || null,
        start_date: habitData.startDate || new Date().toISOString().split('T')[0],
        specific_dates: habitData.specificDates || [],
        is_one_time: habitData.isOneTime || false,
        completed_dates: [],
        streak: 0,
        last_completed_date: null
      }).select();

      if (insertError) {
        console.error('App: Error inserting habit:', insertError);
        showError('Failed to deploy protocol.');
        return;
      }

      if (newHabitData && newHabitData.length > 0) {
        const insertedHabit = newHabitData[0];
        const newHabit: Habit = {
          id: insertedHabit.id,
          name: insertedHabit.name,
          category: insertedHabit.category,
          frequency: insertedHabit.frequency,
          daysOfWeek: insertedHabit.days_of_week || [],
          time: insertedHabit.time_of_day,
          streak: insertedHabit.streak || 0,
          completedDates: insertedHabit.completed_dates || [],
          createdAt: insertedHabit.created_at || new Date().toISOString(),
          startDate: insertedHabit.start_date,
          endDate: insertedHabit.end_date,
          specificDates: insertedHabit.specific_dates,
          isOneTime: insertedHabit.is_one_time,
          lastCompletedDate: insertedHabit.last_completed_date
        };
        setHabits(prev => [...prev, newHabit]);
        showSuccess('Protocol deployed successfully!');
      }

      setSuggestions(prev => prev.filter(s => s.suggestedAction?.payload?.name !== habitData.name));
      setIsModalOpen(false);

    } catch (err) {
      showError('An unexpected error occurred while saving the habit.');
      console.error('App: Error saving habit:', err);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    console.log("App: Completando onboarding...");
    if (!supabaseUserId) {
      showError('Authentication error: Supabase user ID not found.');
      setProfileStatus('error');
      return;
    }
    const toastId = showLoading('Activating protocols...');
    try {
      // 1. Actualizar el perfil existente con los datos de onboarding y establecer has_completed_onboarding a true
      const { error: profileUpdateError } = await supabase.from('user_profiles').update({
        name: newProfile.name,
        email: user?.emailAddresses[0]?.emailAddress, // Usar el email de Clerk
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        narrative: newProfile.narrative,
        has_completed_onboarding: true
      }).eq('id', supabaseUserId); // Usar 'id' que ahora es el ID de Clerk

      if (profileUpdateError) {
        console.error("App: Error al actualizar el perfil en onboarding:", profileUpdateError);
        throw profileUpdateError;
      }

      // 2. Insertar nuevos hábitos
      if (newHabits.length > 0) {
        const habitsToInsert = newHabits.map(h => ({
          user_id: supabaseUserId,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          days_of_week: h.daysOfWeek,
          time_of_day: h.time || null,
          start_date: h.startDate,
          specific_dates: h.specificDates || [],
          is_one_time: h.isOneTime || false,
          completed_dates: [],
          streak: 0,
          last_completed_date: null
        }));
        console.log("App: Hábitos a insertar durante onboarding:", habitsToInsert);
        const { data: insertedHabits, error: habitsInsertError } = await supabase.from('habits').insert(habitsToInsert).select();
        if (habitsInsertError) {
          console.error("App: Error al insertar hábitos en onboarding:", habitsInsertError);
          throw habitsInsertError;
        }
        console.log("App: Hábitos insertados exitosamente durante onboarding:", insertedHabits);
      }
      showSuccess('Onboarding complete! Welcome.');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      showError('Failed to complete onboarding.');
      console.error("App: Error general al guardar datos de onboarding:", error);
      setProfileStatus('error');
    } finally {
      dismissToast(toastId);
      console.log("App: Onboarding completado.");
    }
  };

  const deleteHabit = async (habitId: string) => {
    setHabitToDelete(habitId);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete || !supabaseUserId) return;
    const toastId = showLoading('Deleting habit...');
    try {
      await supabase.from('habits').delete().eq('id', habitToDelete).eq('user_id', supabaseUserId);
      setHabits(prev => prev.filter(h => h.id !== habitToDelete));
      showSuccess('Habit deleted successfully!');
      setHabitToDelete(null);
    } catch (err) {
      showError('Failed to delete habit.');
      console.error('App: Error deleting habit:', err);
      setHabitToDelete(null);
    } finally {
      dismissToast(toastId);
    }
  };

  const toggleHabitCompletion = async (habitId: string, date: string) => {
    if (!supabaseUserId) return;
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.completedDates.includes(date);
      const updatedDates = isCompleted
        ? habit.completedDates.filter(d => d !== date)
        : [...habit.completedDates, date];

      const { streak: newStreak, lastCompletedDate: newLastCompletedDate } = calculateStreak(habit, updatedDates);

      const originalHabits = habits;
      setHabits(prev =>
        prev.map(h =>
          h.id === habitId ? { ...h, completedDates: updatedDates, streak: newStreak, lastCompletedDate: newLastCompletedDate } : h
        )
      );

      const { error } = await supabase
        .from('habits')
        .update({
          completed_dates: updatedDates,
          streak: newStreak,
          last_completed_date: newLastCompletedDate
        })
        .eq('id', habitId)
        .eq('user_id', supabaseUserId);

      if (error) {
        console.error('App: Error updating habit completion:', error);
        showError('Failed to update habit completion.');
        setHabits(originalHabits);
      } else {
        showSuccess(isCompleted ? 'Habit marked incomplete.' : 'Habit marked complete!');
      }
    } catch (err) {
      showError('An unexpected error occurred.');
      console.error('App: Error toggling habit completion:', err);
    }
  };

  const editHabit = (habit: Habit) => {
    console.log('App: Edit habit:', habit);
    // Implement actual edit logic or open an edit modal here
  };

  const startEditStatement = () => {
    setEditingStatement(profile?.identityStatement || '');
    setIsEditingStatement(true);
  };

  const saveStatement = async () => {
    if (!editingStatement.trim() || !profile || !supabaseUserId) return;
    const toastId = showLoading('Updating identity statement...');
    try {
      await supabase.from('user_profiles').update({
        identity_statement: editingStatement
      }).eq('id', supabaseUserId); // Usar 'id' que ahora es el ID de Clerk
      setProfile({ ...profile, identityStatement: editingStatement });
      setIsEditingStatement(false);
      showSuccess('Identity statement updated!');
    } catch (err) {
      showError('Failed to update identity statement.');
      console.error('App: Error updating statement:', err);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleUpdateProfileName = async (newName: string) => {
    if (!profile || !supabaseUserId) {
      throw new Error("User or profile not available.");
    }
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name: newName })
        .eq('id', supabaseUserId); // Usar 'id' que ahora es el ID de Clerk

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      console.error("App: Error updating profile name:", error);
      throw error;
    }
  };

  const handleDownloadUserData = () => {
    if (!user || !profile) {
      showError('No user data to download.');
      return;
    }

    const toastId = showLoading('Preparing your data for download...');
    try {
      const userData = {
        profile: {
          name: profile.name,
          email: profile.email,
          isPremium: profile.isPremium,
          identityStatement: profile.identityStatement,
          focusAreas: profile.focusAreas,
          narrative: profile.narrative,
        },
        habits: habits.map(h => ({
          id: h.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          daysOfWeek: h.daysOfWeek,
          time: h.time,
          description: h.description,
          streak: h.streak,
          completedDates: h.completedDates,
          createdAt: h.createdAt,
          startDate: h.startDate,
          endDate: h.endDate,
          specificDates: h.specificDates,
          isOneTime: h.isOneTime,
          lastCompletedDate: h.lastCompletedDate,
        })),
      };

      const jsonString = JSON.stringify(userData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-growth-space-data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Your data has been downloaded!');
    } catch (error) {
      showError('Failed to download data.');
      console.error("App: Error downloading user data:", error);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleDeleteAccount = async () => {
    if (!supabaseUserId) {
      console.error("App: No Supabase user ID available for deletion.");
      throw new Error("Authentication details missing for account deletion.");
    }

    const toastId = showLoading('Deleting account...');
    try {
      // Primero, eliminar los datos del perfil del usuario de Supabase
      // La tabla user_profiles tiene una clave foránea con CASCADE DELETE a auth.users(id)
      // Sin embargo, para asegurar que se elimine el perfil antes de intentar eliminar el usuario de auth.users
      // (que podría fallar si el perfil aún existe debido a restricciones),
      // es mejor eliminar explícitamente el perfil primero.
      const { error: supabaseProfileDeleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', supabaseUserId); // Usar 'id' que ahora es el ID de Clerk

      if (supabaseProfileDeleteError) {
        console.error("App: Error deleting Supabase profile:", supabaseProfileDeleteError);
        throw supabaseProfileDeleteError;
      }

      // Luego, invocar la función Edge para eliminar el usuario de auth.users
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        throw new Error("Clerk token not found for account deletion.");
      }

      const { data: deleteUserResponse, error: deleteUserFunctionError } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
        body: {},
      });

      if (deleteUserFunctionError) {
        console.error("App: Error invoking delete-user edge function:", deleteUserFunctionError);
        throw deleteUserFunctionError;
      }

      console.log("App: Delete user function response:", deleteUserResponse);

      await signOut(); // Cerrar sesión de Clerk
      showSuccess('Account and data deleted successfully!');
    } catch (error) {
      showError('Failed to delete account.');
      console.error("App: Error deleting account:", error);
      throw error;
    } finally {
      dismissToast(toastId);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("App: Error during logout:", error);
      throw error;
    }
  };

  // --- Efectos de React ---
  useEffect(() => {
    if (!isLoaded) {
      setProfileStatus('idle');
      return;
    }

    if (isSignedIn && user) {
      const loadUserData = async () => {
        console.log("App: Iniciando loadUserData...");
        setProfileStatus('loading');
        try {
          // Obtener el token de Clerk con la plantilla 'supabase'
          const clerkToken = await getToken({ template: 'supabase' });
          if (!clerkToken) {
            throw new Error("Clerk token not found. Ensure 'supabase' JWT template is configured in Clerk and returns a valid token.");
          }

          // Establecer la sesión de Supabase con el token de Clerk
          // Supabase espera un refresh_token, pero Clerk solo proporciona un access_token para la sesión.
          // Para satisfacer el tipo, pasamos el access_token como refresh_token también.
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: clerkToken,
            refresh_token: clerkToken, // Usar access_token como refresh_token para compatibilidad
          });

          if (sessionError) {
            console.error("App: Error setting Supabase session with Clerk token:", sessionError);
            throw new Error(`Failed to set Supabase session: ${sessionError.message}. Check Clerk JWT template configuration.`);
          }

          const currentSupabaseUser = sessionData?.user;

          if (!currentSupabaseUser || !currentSupabaseUser.id) {
            console.error("App: Supabase user or user ID not found after setting session.");
            setProfileStatus('error');
            return;
          }

          // El ID de usuario de Supabase ahora es el user.id de Clerk (TEXT)
          setSupabaseUserId(currentSupabaseUser.id);

          // Ahora usar currentSupabaseUser.id para todas las consultas
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentSupabaseUser.id) // Usar 'id' que ahora es el ID de Clerk
            .maybeSingle();

          if (profileError) {
            console.error("App: Error al obtener datos del perfil:", profileError);
            showError('Fallo al cargar los datos del perfil de usuario.');
            setProfileStatus('error');
            return;
          }

          if (!profileData || profileData.has_completed_onboarding === false) {
            console.log("App: Perfil no encontrado o onboarding incompleto. Mostrando onboarding.");
            setProfile(null);
            setHabits([]);
            setProfileStatus('onboarding');
          } else {
            console.log("App: Perfil de usuario cargado:", profileData);
            const loadedProfile: UserProfile = {
              name: profileData.name,
              email: profileData.email,
              isPremium: profileData.is_premium,
              identityStatement: profileData.identity_statement,
              focusAreas: profileData.focus_areas,
              narrative: profileData.narrative
            };
            setProfile(loadedProfile);

            const { data: habitsData, error: habitsError } = await supabase
              .from('habits')
              .select('*')
              .eq('user_id', currentSupabaseUser.id); // Usar el ID de usuario de Supabase (TEXT)

            if (habitsError) {
              console.error("App: Error al obtener datos de hábitos:", habitsError);
              showError('Fallo al cargar los datos de hábitos.');
              setProfileStatus('error');
              return;
            }

            console.log("App: Hábitos cargados:", habitsData);
            setHabits((habitsData || []).map(h => ({
              id: h.id,
              name: h.name,
              category: h.category,
              frequency: h.frequency,
              daysOfWeek: h.days_of_week || [],
              time: h.time_of_day,
              streak: h.streak || 0,
              completedDates: h.completed_dates || [],
              createdAt: h.created_at || new Date().toISOString(),
              startDate: h.start_date,
              endDate: h.end_date,
              specificDates: h.specific_dates || [],
              isOneTime: h.is_one_time || false,
              lastCompletedDate: h.last_completed_date
            })));
            setProfileStatus('ready');
          }
        } catch (error) {
          console.error("App: Error general en loadUserData:", error);
          showError('Ocurrió un error inesperado al cargar tus datos.');
          setProfile(null);
          setHabits([]);
          setProfileStatus('error');
          setSupabaseUserId(null);
        }
      };
      loadUserData();
    } else {
      setProfile(null);
      setHabits([]);
      setProfileStatus('idle');
      setSupabaseUserId(null);
    }
  }, [isSignedIn, isLoaded, user, refreshTrigger, getToken, signOut]);

  // --- Lógica de renderizado condicional ---
  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="text-cyan-400 animate-spin" size={40} /></div>;
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-orange-900 to-blue-900 blur-3xl"></div>

          <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-8 relative z-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-6">
                <UserIcon size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Welcome to Growth Space</h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sign in to continue</p>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md text-center">
              <SignInButton mode="modal">
                <button className="w-full bg-cyan-500 text-black rounded-2xl py-4 font-black text-lg flex items-center justify-center space-x-2 hover:bg-cyan-400 transition-all active:scale-95">
                  <UserIcon size={24} />
                  <span>Sign In / Sign Up</span>
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {profileStatus === 'loading' && (
          <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="text-cyan-400 animate-spin" size={40} /></div>
        )}

        {profileStatus === 'onboarding' && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {profileStatus === 'error' && (
          <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 text-red-500 text-center">
            <Zap size={40} className="mb-4" />
            <h2 className="text-xl font-bold mb-2">Error de Carga de Perfil</h2>
            <p className="text-sm">No se pudo cargar la información de tu perfil. Por favor, intenta refrescar la página.</p>
            <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold hover:bg-white/20 transition-all">
              Refrescar
            </button>
          </div>
        )}

        {profileStatus === 'ready' && profile && (
          <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans pb-64">
            <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">My Growth Space</span>
                <span className="font-black text-[26px] tracking-tighter text-white">{profile?.name || 'Guest'}</span>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:text-cyan-400 transition-all"
              >
                <UserIcon size={18} />
              </button>
            </nav>

            {currentView === 'home' ? (
              <main className="pt-28 px-6 space-y-8">
                <div className="relative bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border border-blue-600/20 rounded-[2.5rem] p-8 flex flex-col gap-8 items-center max-w-3xl mx-auto w-full">
                  <div className="absolute top-6 right-6 text-cyan-500 opacity-20">
                    <UserIcon size={80} strokeWidth={1} />
                  </div>
                  <div className="flex-1 text-center relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">PERSON'S MANIFESTO</span>
                    {isEditingStatement ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={editingStatement}
                          onChange={(e) => setEditingStatement(e.target.value)}
                          maxLength={264}
                          className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-white text-sm outline-none focus:border-cyan-500 resize-none font-medium"
                          rows={5}
                          placeholder="Your 264-character identity statement..."
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-black uppercase">{editingStatement.length}/264</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsEditingStatement(false)}
                              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-black text-slate-400 hover:text-white transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveStatement}
                              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-sm font-black text-cyan-400 hover:bg-cyan-500/30 transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={startEditStatement}
                        className="text-slate-300 italic text-lg hover:text-cyan-400 transition-colors group leading-relaxed"
                      >
                        "{profile?.identityStatement}"
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-w-3xl mx-auto w-full">
                  <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
                </div>

                <div className="max-w-3xl mx-auto w-full space-y-6">
                  <div className="space-y-6">
                    <div className="grid gap-2">
                      {habits.length === 0 ? (
                        <div className="p-12 border border-dashed border-white/10 rounded-[2.5rem] text-center text-slate-500">
                          Your protocol is empty. Use the prompt above to initialize.
                        </div>
                      ) : (
                        habits.map(h => (
                          <HabitCard key={h.id} habit={h} selectedDateStr={selectedDate} onToggle={toggleHabitCompletion} onDelete={deleteHabit} onEdit={editHabit} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Añadir los componentes de Chipi Pay aquí para probarlos */}
                <div className="max-w-3xl mx-auto w-full space-y-6 mt-8">
                  <CreateWallet />
                  <Transfer />
                </div>
              </main>
            ) : (
              <div className="pt-28">
                <InsightsPage habits={habits} />
              </div>
            )}

            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30 flex flex-col gap-4">
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  {suggestions.map((suggestion, idx) => (
                    <InsightCard
                      key={idx}
                      suggestion={suggestion}
                      onAccept={saveHabit}
                      onReject={() => setSuggestions(prev => prev.filter((_, i) => i !== idx))}
                    />
                  ))}
                </div>
              )}
              <form onSubmit={handleQuickLog} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-600/50 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
                <div className="relative bg-white/5 border border-white/10 rounded-3xl p-1 flex items-center backdrop-blur-xl">
                  <div className="pl-4 text-slate-500">
                    {isProcessingAI ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
                  </div>
                  <input
                    type="text"
                    placeholder="Feed protocol data..."
                    className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-slate-600"
                    value={quickLog}
                    onChange={(e) => setQuickLog(e.target.value)}
                  />
                  <button type="submit" className="bg-white/5 text-slate-500 p-3 rounded-2xl mr-1 hover:bg-white/10 transition-all">
                    <SendHorizonal size={20} strokeWidth={2} />
                  </button>
                </div>
              </form>
            </div>

            <BottomNavBar
              currentView={currentView}
              onHomeClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onInsightsClick={() => {
                setCurrentView('insights');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddHabitClick={() => setIsModalOpen(true)}
            />

            <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveHabit} />

            {habitToDelete && (
              <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-4">Delete Habit?</h3>
                  <p className="text-slate-400 text-sm mb-8">
                    Are you sure you want to delete this habit? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setHabitToDelete(null)}
                      className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteHabit}
                      className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400 font-black text-sm hover:bg-red-500/30 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {profile && (
              <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userProfile={profile}
                onUpdateProfile={handleUpdateProfileName}
                onDownloadData={handleDownloadUserData}
                onDeleteAccount={handleDeleteAccount}
                onLogout={handleLogout}
              />
            )}
          </div>
        )}
      </SignedIn>
    </>
  );
};

export default App;