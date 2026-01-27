import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, // Usaremos este icono para abrir el modal de perfil
  Loader2,
  Zap,
  RotateCcw, 
  SendHorizonal, 
} from 'lucide-react';
import { useAuth } from './src/components/AuthProvider';
import Login from './src/pages/Login';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import InsightCard from './components/InsightCard';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import UserProfileModal from './src/components/UserProfileModal'; // Importar el nuevo modal
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';
import { generateSuggestedCards } from './services/geminiService';
import InsightsPage from './src/pages/InsightsPage'; // Importar la nueva página de Insights
import { showSuccess, showError, showLoading, dismissToast } from './src/utils/toast'; // Importar utilidades de toast

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
    let streakEndsOnDate: string | null = null; // This will store the latest date in the streak

    const actualToday = new Date();
    actualToday.setHours(0, 0, 0, 0); // Normalize to start of day
    const actualTodayStr = actualToday.toISOString().split('T')[0];

    // Filter completed dates up to and including actualToday
    const relevantCompletedDates = sortedDates.filter(date => date <= actualTodayStr);

    if (relevantCompletedDates.length === 0) {
      return { streak: 0, lastCompletedDate: null };
    }

    let checkDate = new Date(actualToday); // Start checking from actual today
    checkDate.setHours(0, 0, 0, 0);

    // Check if today is completed
    if (relevantCompletedDates.includes(actualTodayStr)) {
      currentStreak++;
      streakEndsOnDate = actualTodayStr;
      checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
    } else {
      // If not completed today, check if yesterday was completed
      checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (relevantCompletedDates.includes(yesterdayStr)) {
        currentStreak++;
        streakEndsOnDate = yesterdayStr;
        checkDate.setDate(checkDate.getDate() - 1); // Move to day before yesterday
      } else {
        // No completion today or yesterday, streak is 0
        return { streak: 0, lastCompletedDate: relevantCompletedDates[relevantCompletedDates.length - 1] };
      }
    }

    // Continue checking backwards
    while (true) {
      const currentCheckDateStr = checkDate.toISOString().split('T')[0];
      if (relevantCompletedDates.includes(currentCheckDateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    
    return { streak: currentStreak, lastCompletedDate: streakEndsOnDate };
  }

  // For 'weekly' habits, a simple streak calculation is more complex and out of scope for this single response.
  // For now, we'll just return 0 streak for weekly habits.
  return { streak: 0, lastCompletedDate: sortedDates[sortedDates.length - 1] || null };
};


const App: React.FC = () => {
  const { user, loading: authLoading, signOut, session } = useAuth(); // Añadir 'session' aquí
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Nuevo estado para el modal de perfil

  // --- Efectos de React ---
  useEffect(() => {
    if (authLoading) {
      setProfileStatus('idle'); 
      return;
    }

    if (user) {
      const loadUserData = async () => {
        console.log("App: Iniciando loadUserData...");
        setProfileStatus('loading');
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user?.id)
            .maybeSingle();

          if (profileError) {
            console.error("App: Error al obtener datos del perfil:", profileError);
            throw profileError;
          }
          
          if (!profileData || profileData.has_completed_onboarding === false) {
            console.log("App: Perfil no encontrado o onboarding incompleto. Mostrando onboarding.");
            setProfile(null);
            setHabits([]);
            setProfileStatus('onboarding');
          } else {
            console.log("App: Perfil de usuario cargado:", profileData);
            setProfile({
              name: profileData.name,
              email: profileData.email,
              isPremium: profileData.is_premium,
              identityStatement: profileData.identity_statement,
              focusAreas: profileData.focus_areas,
              narrative: profileData.narrative
            });
            
            const { data: habitsData, error: habitsError } = await supabase
              .from('habits')
              .select('*')
              .eq('user_id', user?.id);

            if (habitsError) {
              console.error("App: Error al obtener datos de hábitos:", habitsError);
              throw habitsError;
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
          setProfile(null); 
          setHabits([]);
          setProfileStatus('error');
        }
      };
      loadUserData();
    } else {
      setProfile(null);
      setHabits([]);
      setProfileStatus('idle'); 
    }
  }, [user, authLoading]);

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
    if (!habitData.name) return;

    const toastId = showLoading('Deploying protocol...');
    try {
      const { data: existing, error: selectErr } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user?.id)
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
        user_id: user?.id,
        name: habitData.name,
        category: habitData.category,
        frequency: habitData.isOneTime ? 'one-time' : (habitData.frequency || 'daily'), // Ajustado para 'one-time'
        days_of_week: habitData.daysOfWeek || (habitData.isOneTime ? [] : [0,1,2,3,4,5,6]), // Si es one-time, no hay días de la semana
        time_of_day: habitData.time,
        start_date: habitData.startDate || new Date().toISOString().split('T')[0], // Usar startDate si está disponible
        specific_dates: habitData.specificDates || [], // Añadir specific_dates
        is_one_time: habitData.isOneTime || false, // Añadir is_one_time
        completed_dates: [],
        streak: 0, // Inicializar racha a 0
        last_completed_date: null // Inicializar última fecha de completado a null
      }).select(); // Capturamos los datos insertados

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
        setHabits(prev => [...prev, newHabit]); // Actualizamos el estado directamente
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
    const toastId = showLoading('Activating protocols...');
    try {
      const { error: profileUpsertError } = await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        name: newProfile.name,
        email: user?.email,
        identity_statement: newProfile.identityStatement,
        focus_areas: newProfile.focusAreas,
        has_completed_onboarding: true
      }, { onConflict: 'user_id' });

      if (profileUpsertError) {
        console.error("App: Error al guardar el perfil en onboarding:", profileUpsertError);
        throw profileUpsertError;
      }

      if (newHabits.length > 0) {
        const habitsToInsert = newHabits.map(h => ({
          user_id: user?.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          days_of_week: h.daysOfWeek,
          time_of_day: h.time,
          completed_dates: [],
          streak: 0, // Inicializar racha a 0
          last_completed_date: null // Inicializar última fecha de completado a null
        }));
        const { error: habitsInsertError } = await supabase.from('habits').insert(habitsToInsert).select();
        if (habitsInsertError) {
          console.error("App: Error al insertar hábitos en onboarding:", habitsInsertError);
          throw habitsInsertError;
        }
      }
      showSuccess('Onboarding complete! Welcome.');
      setProfileStatus('loading'); 
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
    if (!habitToDelete) return;
    const toastId = showLoading('Deleting habit...');
    try {
      await supabase.from('habits').delete().eq('id', habitToDelete);
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
        .eq('id', habitId);

      if (error) {
        console.error('App: Error updating habit completion:', error);
        showError('Failed to update habit completion.');
        setHabits(originalHabits); // Revertir si hay error
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
    if (!editingStatement.trim() || !profile) return;
    const toastId = showLoading('Updating identity statement...');
    try {
      await supabase.from('user_profiles').update({
        identity_statement: editingStatement
      }).eq('user_id', user?.id);
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

  // --- Nuevas funciones para el UserProfileModal ---
  const handleUpdateProfileName = async (newName: string) => {
    if (!user || !profile) {
      throw new Error("User or profile not available.");
    }
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name: newName })
        .eq('user_id', user.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      console.error("App: Error updating profile name:", error);
      throw error; // Re-throw to be caught by modal's toast handler
    }
  };

  const handleDownloadUserData = () => {
    if (!user || !profile) {
      showError('No user data to download.');
      return;
    }

    const toastId = showLoading('Preparing your data for download...');
    try {
      // Asegurarse de que no se incluyan IDs de sistema internos como user_id de auth.users o profile.id de user_profiles.
      // El estado 'profile' ya excluye 'id' y 'user_id' de la base de datos.
      // 'Habit.id' es un identificador único para los propios hábitos del usuario, útil para la integridad de los datos.
      const userData = {
        profile: {
          name: profile.name,
          email: profile.email, // El propio correo electrónico del usuario, considerado parte de sus datos
          isPremium: profile.isPremium,
          identityStatement: profile.identityStatement,
          focusAreas: profile.focusAreas,
          narrative: profile.narrative,
        },
        habits: habits.map(h => ({
          id: h.id, // Mantener el ID del hábito para la unicidad y posible reimportación
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
      a.download = `my-growth-space-data.json`; // Nombre de archivo simplificado
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
    if (!user || !session || !user.email) {
      console.error("App: No user, session, or user email available for deletion.");
      throw new Error("Authentication details missing for account deletion.");
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("App: Error invoking delete-user function:", error);
        throw error;
      }

      console.log("App: User account deleted successfully:", data);
      await signOut();
    } catch (error) {
      console.error("App: Error deleting account:", error);
      throw error;
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

  // --- Lógica de renderizado condicional ---

  if (authLoading || profileStatus === 'loading') {
    return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="text-cyan-400 animate-spin" size={40} /></div>;
  }

  if (!user) {
    return <Login />;
  }

  if (profileStatus === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (profileStatus === 'error') {
    console.error("App: Error al cargar el perfil del usuario. Estado: 'error'.");
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 text-red-500 text-center">
        <Zap size={40} className="mb-4" />
        <h2 className="text-xl font-bold mb-2">Error de Carga de Perfil</h2>
        <p className="text-sm">No se pudo cargar la información de tu perfil. Por favor, intenta refrescar la página.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold hover:bg-white/20 transition-all">
          Refrescar
        </button>
      </div>
    );
  }

  if (!profile) {
    console.error("App: ERROR CRÍTICO - El perfil es null cuando profileStatus es 'ready'.");
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 text-red-500 text-center">
        <Zap size={40} className="mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Crítico de Perfil</h2>
        <p className="text-sm">Se ha producido un error inesperado al cargar tu perfil. Por favor, intenta cerrar sesión y volver a iniciarla.</p>
        <button onClick={() => signOut()} className="mt-6 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold hover:bg-white/20 transition-all">
          Cerrar Sesión
        </button>
      </div>
    );
  }

  console.log("App: Renderizando contenido principal. Perfil:", profile, "Hábitos:", habits);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans pb-64">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">My Growth Space</span>
          <span className="font-black text-[26px] tracking-tighter text-white">{profile?.name || 'Guest'}</span>
        </div>
        {/* Botón de perfil de usuario */}
        <button 
          onClick={() => setIsProfileModalOpen(true)} 
          className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:text-cyan-400 transition-all"
        >
          <UserIcon size={18} />
        </button>
      </nav>

      {currentView === 'home' ? (
        <main className="pt-28 px-6 space-y-8">
          {/* Sección de Perfil de Persona */}
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

          {/* Carrusel de Fechas */}
          <div className="max-w-3xl mx-auto w-full">
            <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>

          {/* Lista de Hábitos */}
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
        </main>
      ) : (
        <div className="pt-28"> {/* Añadir padding para la página de insights */}
          <InsightsPage habits={habits} />
        </div>
      )}

      {/* Quick Log Input y Sugerencias (ahora flotante en la parte inferior) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30 flex flex-col gap-4">
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
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Desplazamiento al inicio
        }}
        onAddHabitClick={() => setIsModalOpen(true)} // Pasar la función para abrir el modal
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
  );
};

export default App;