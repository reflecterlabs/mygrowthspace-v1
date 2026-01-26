import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  User as UserIcon,
  LogOut,
  Loader2,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './src/components/AuthProvider';
import Login from './src/pages/Login';
import Onboarding from './components/Onboarding';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import InsightCard from './components/InsightCard';
import DateCarousel from './components/DateCarousel';
import BottomNavBar from './components/BottomNavBar';
import { supabase } from './src/integrations/supabase/client';
import { Habit, UserProfile } from './types';
import { generateSuggestedCards } from './services/geminiService';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickLog, setQuickLog] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [editingStatement, setEditingStatement] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'insights' | 'profile'>('home');
  const [profileLoading, setProfileLoading] = useState(true); // Nuevo estado para la carga del perfil

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      // Si el usuario cierra sesión o no está presente, restablecer estados y detener la carga
      setProfile(null);
      setHabits([]);
      setShowOnboarding(false);
      setProfileLoading(false); // No hay perfil que cargar si no hay usuario
    }
  }, [user]);

  const fetchUserData = async () => {
    console.log("App: Iniciando fetchUserData...");
    setProfileLoading(true); // Iniciar la carga del perfil
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error("App: Error al obtener datos del perfil:", profileError);
        throw profileError; // Propagar el error para que sea capturado por el catch
      }
      
      if (!profileData || profileData.has_completed_onboarding === false) {
        console.log("App: Perfil no encontrado o onboarding incompleto. Mostrando onboarding.");
        setShowOnboarding(true);
        setProfile(null); // Asegurarse de que el perfil sea null si se necesita el onboarding
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
        setShowOnboarding(false); // Asegurarse de que el onboarding esté oculto si el perfil se cargó
        
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user?.id);

        if (habitsError) {
          console.error("App: Error al obtener datos de hábitos:", habitsError);
          throw habitsError; // Propagar el error
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
          createdAt: h.created_at || new Date().toISOString()
        })));
      }
    } catch (error) {
      console.error("App: Error general en fetchUserData:", error);
      // Asegurarse de que el perfil y los hábitos estén en un estado conocido en caso de error
      setProfile(null); 
      setHabits([]);
      setShowOnboarding(true); // Podría ser útil volver al onboarding o mostrar un error
    } finally {
      console.log("App: fetchUserData finalizado.");
      setProfileLoading(false); // Finalizar la carga del perfil
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLog.trim()) return;

    setIsProcessingAI(true);
    try {
      const aiSuggestions = await generateSuggestedCards(quickLog, habits);
      setSuggestions(aiSuggestions);
      setQuickLog('');
    } catch (err) {
      console.error("App: AI Error en handleQuickLog:", err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const saveHabit = async (habitData: Partial<Habit>) => {
    if (!habitData.name) return;

    try {
      // Check for an existing habit with same user and name to avoid duplicates
      const { data: existing, error: selectErr } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user?.id)
        .eq('name', habitData.name)
        .maybeSingle();

      if (selectErr) console.error('App: Error checking existing habit:', selectErr);

      if (existing) {
        // Already exists — remove from suggestions and show feedback
        setSuggestions(prev => prev.filter(s => s.suggestedAction?.payload?.name !== habitData.name));
        return;
      }

      const { error: insertError } = await supabase.from('habits').insert({
        user_id: user?.id,
        name: habitData.name,
        category: habitData.category,
        frequency: habitData.frequency || 'daily',
        days_of_week: habitData.daysOfWeek || [0,1,2,3,4,5,6],
        time_of_day: habitData.time,
        start_date: new Date().toISOString().split('T')[0],
        completed_dates: []
      }).select();

      if (insertError) {
        console.error('App: Error inserting habit:', insertError);
        return;
      }

      // Only remove this specific suggestion after successful save
      setSuggestions(prev => prev.filter(s => s.suggestedAction?.payload?.name !== habitData.name));
      setIsModalOpen(false);
      fetchUserData();
    } catch (err) {
      console.error('App: Error saving habit:', err);
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile, newHabits: Habit[]) => {
    console.log("App: Completando onboarding...");
    try {
      const { error: profileUpsertError } = await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        name: newProfile.name,
        email: user?.email, // <-- Usando el email del usuario autenticado
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
          completed_dates: []
        }));
        const { error: habitsInsertError } = await supabase.from('habits').insert(habitsToInsert).select();
        if (habitsInsertError) {
          console.error("App: Error al insertar hábitos en onboarding:", habitsInsertError);
          throw habitsInsertError;
        }
      }

      setShowOnboarding(false);
      fetchUserData();
    } catch (error) {
      console.error("App: Error general al guardar datos de onboarding:", error);
      // Podrías querer mostrar un mensaje de error al usuario aquí
    } finally {
      console.log("App: Onboarding completado.");
    }
  };

  const deleteHabit = async (habitId: string) => {
    setHabitToDelete(habitId);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      await supabase.from('habits').delete().eq('id', habitToDelete);
      setHabits(prev => prev.filter(h => h.id !== habitToDelete));
      setHabitToDelete(null);
    } catch (err) {
      console.error('App: Error deleting habit:', err);
      setHabitToDelete(null);
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

      // Optimistic update
      const originalHabits = habits;
      setHabits(prev =>
        prev.map(h =>
          h.id === habitId ? { ...h, completedDates: updatedDates } : h
        )
      );

      const { error } = await supabase
        .from('habits')
        .update({ completed_dates: updatedDates })
        .eq('id', habitId);

      if (error) {
        console.error('App: Error updating habit completion:', error);
        // Revert on error
        setHabits(originalHabits);
      }
    } catch (err) {
      console.error('App: Error toggling habit completion:', err);
    }
  };

  const editHabit = (habit: Habit) => {
    console.log('App: Edit habit:', habit);
  };

  const startEditStatement = () => {
    setEditingStatement(profile?.identityStatement || '');
    setIsEditingStatement(true);
  };

  const saveStatement = async () => {
    if (!editingStatement.trim() || !profile) return;
    try {
      await supabase.from('user_profiles').update({
        identity_statement: editingStatement
      }).eq('user_id', user?.id);
      setProfile({ ...profile, identityStatement: editingStatement });
      setIsEditingStatement(false);
    } catch (err) {
      console.error('App: Error updating statement:', err);
    }
  };

  // Mostrar spinner si la autenticación o la carga del perfil están en curso
  if (authLoading || profileLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="text-cyan-400 animate-spin" size={40} /></div>;
  if (!user) return <Login />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  // Esta comprobación defensiva ahora solo se activará si hay un problema genuino
  // después de que la carga del perfil haya terminado y el usuario esté presente,
  // pero el perfil sigue siendo null.
  if (!profile) {
    console.error("App: El perfil es null/undefined cuando debería estar cargado. Esto indica un problema.");
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

  console.log("App: Renderizando contenido principal. Perfil:", profile, "Hábitos:", habits);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans pb-28">
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <Dumbbell size={20} />
          </div>
          <span className="font-black text-lg tracking-tighter">My Growth Space</span>
        </div>
        <button onClick={() => signOut()} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:text-red-400 transition-all">
          <LogOut size={18} />
        </button>
      </nav>

      <main className="pt-28 px-6 space-y-8">
        <section className="max-w-3xl mx-auto w-full space-y-6">
          <form onSubmit={handleQuickLog} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-600/50 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-1 flex items-center backdrop-blur-xl">
              <div className="pl-4 text-cyan-400">
                {isProcessingAI ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              </div>
              <input 
                type="text" 
                placeholder="Describe your routine or a new habit..." 
                className="w-full bg-transparent p-4 outline-none text-white font-medium"
                value={quickLog}
                onChange={(e) => setQuickLog(e.target.value)}
              />
              <button type="submit" className="bg-white text-black p-3 rounded-2xl mr-1 hover:bg-cyan-500 transition-all">
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </form>

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
        </section>

        <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center max-w-3xl mx-auto w-full">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <UserIcon size={40} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-white">{profile?.name}</h1>
            {isEditingStatement ? (
              <div className="mt-4 space-y-3">
                <textarea
                  value={editingStatement}
                  onChange={(e) => setEditingStatement(e.target.value)}
                  maxLength={264}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-white text-sm outline-none focus:border-cyan-500 resize-none font-medium"
                  rows={3}
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
                className="text-slate-400 italic mt-1 hover:text-cyan-400 transition-colors text-sm group"
              >
                {profile?.identityStatement}
                <span className="block text-[10px] font-black uppercase text-slate-600 group-hover:text-cyan-500 mt-2">Click to edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Calendar className="text-cyan-400" size={20} />
                Current Stack
              </h2>
              <DateCarousel selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>
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

      <BottomNavBar 
        currentView={currentView}
        onAddClick={() => setIsModalOpen(true)}
        onHomeClick={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onInsightsClick={() => setCurrentView('insights')}
        onProfileClick={() => setCurrentView('profile')}
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
    </div>
  );
};

export default App;