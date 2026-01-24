import React, { useState } from 'react';
import { UserProfile, Habit } from '../types';
import { 
  User, 
  Target, 
  Dumbbell, 
  BookOpen, 
  Check, 
  Loader2, 
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { parseRoutineIntoHabits } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: UserProfile, habits: Habit[]) => void;
}

const CATEGORIES = ['Health', 'Mindset', 'Productivity', 'Finance', 'Social'];
// const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // No utilizada

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    isPremium: false,
    identityStatement: '',
    focusAreas: [],
    narrative: ''
  });
  const [suggestedHabits, setSuggestedHabits] = useState<Partial<Habit>[]>([]);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => setStep(s => s + 1);

  const toggleFocusArea = (area: string) => {
    setProfile(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area) 
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const handleAnalyzeRoutine = async () => {
    if (!profile.narrative) return;
    setLoading(true);
    try {
      const result = await parseRoutineIntoHabits(profile.narrative);
      setSuggestedHabits(result.habits.map(h => ({ ...h, startDate: new Date().toISOString().split('T')[0] })));
      setProfile(prev => ({ ...prev, identityStatement: result.identity }));
      setStep(4);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateSuggestedHabit = (index: number, updates: Partial<Habit>) => {
    const newList = [...suggestedHabits];
    newList[index] = { ...newList[index], ...updates };
    setSuggestedHabits(newList);
  };

  const finalizeOnboarding = () => {
    const finalHabits: Habit[] = suggestedHabits.map((h) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: h.name || 'Unnamed Protocol',
      category: h.category as any || 'Mindset',
      frequency: 'daily',
      daysOfWeek: h.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      time: h.time,
      description: h.description,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
      startDate: h.startDate,
      isOneTime: h.isOneTime || false
    }));
    onComplete(profile, finalHabits);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[100] flex flex-col items-center p-0 overflow-y-auto">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/5 z-[110]">
        <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-md w-full flex flex-col min-h-full pb-10">
        
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 animate-in duration-700 relative">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-orange-600/20 via-transparent to-cyan-500/20 pointer-events-none"></div>
            
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-cyan-400 relative z-10">
              <Dumbbell size={48} className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            </div>

            <div className="text-center space-y-4 relative z-10">
              <h1 className="text-4xl font-black text-white tracking-tighter">My Growth Space</h1>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Sync your identity with the science of <span className="text-cyan-400 font-black">Atomic Discipline</span>.
              </p>
            </div>

            <div className="w-full space-y-4 relative z-10">
              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex items-center space-x-4">
                <div className="text-orange-500"><Target size={24} /></div>
                <div className="text-sm font-bold text-white">Identity Mapping</div>
              </div>
              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex items-center space-x-4">
                <div className="text-cyan-400"><BookOpen size={24} /></div>
                <div className="text-sm font-bold text-white">Pattern Recognition</div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="w-full bg-white text-black rounded-[2.5rem] py-6 font-black text-xl flex items-center justify-center space-x-3 shadow-2xl hover:scale-[1.02] transition-all active:scale-95 relative z-20"
            >
              <span>Initialize Synchronization</span>
              <ArrowRight size={24} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in duration-500">
            <div className="p-5 bg-white/5 border border-white/10 rounded-full text-cyan-400"><User size={40} /></div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">Designate Identity</h1>
              <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Who is performing this protocol?</p>
            </div>
            <input 
              type="text" 
              className="w-full bg-transparent border-b-2 border-slate-800 focus:border-cyan-500 outline-none text-2xl py-4 text-center text-white font-black transition-all"
              placeholder="System Operator"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              autoFocus
            />
            <button 
              disabled={!profile.name} 
              onClick={handleNext} 
              className="w-full bg-cyan-500 text-black rounded-3xl py-5 font-black shadow-lg disabled:opacity-20 relative z-20"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in duration-500">
            <div className="p-5 bg-white/5 border border-white/10 rounded-full text-orange-500"><Target size={40} /></div>
            <div className="text-center"><h2 className="text-2xl font-black text-white">Focus Vectors</h2></div>
            <div className="grid grid-cols-2 gap-4 w-full">
              {CATEGORIES.map(area => (
                <button 
                  key={area}
                  onClick={() => toggleFocusArea(area)}
                  className={`py-6 px-4 rounded-3xl border-2 transition-all text-xs font-black uppercase tracking-widest ${profile.focusAreas.includes(area) ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                >
                  {area}
                </button>
              ))}
            </div>
            <button 
              disabled={profile.focusAreas.length === 0} 
              onClick={handleNext} 
              className="w-full bg-cyan-500 text-black rounded-3xl py-5 font-black shadow-lg relative z-20"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-in duration-500">
            <div className="text-center space-y-2">
              <div className="p-5 bg-white/5 border border-white/10 rounded-full text-cyan-400 mx-auto w-20 h-20 flex items-center justify-center mb-4"><BookOpen size={32} /></div>
              <h2 className="text-2xl font-black text-white tracking-tight">Neural Input</h2>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Describe your existing or ideal cycle.</p>
            </div>
            <textarea 
              className="w-full bg-white/5 border border-white/10 focus:border-cyan-500 rounded-[2.5rem] p-8 outline-none min-h-[250px] text-white font-medium placeholder:text-slate-700 transition-all shadow-inner relative z-10"
              placeholder="Example: I train every morning. I meditate at 6pm. Every Monday I review finances..."
              value={profile.narrative}
              onChange={e => setProfile({...profile, narrative: e.target.value})}
            />
            <button 
              disabled={!profile.narrative || loading}
              onClick={handleAnalyzeRoutine}
              className="w-full bg-white text-black rounded-[2.5rem] py-6 font-black flex items-center justify-center space-x-3 shadow-2xl disabled:opacity-20 relative z-20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Dumbbell size={24} />}
              <span>Construct Protocol</span>
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="p-6 space-y-6 animate-in duration-500">
            <div className="text-left"><h2 className="text-2xl font-black text-white">Calculated Protocol</h2></div>
            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="flex items-center space-x-2 mb-2 text-cyan-400 font-black uppercase tracking-widest text-[10px]"><Dumbbell size={14} /><span>Identity Sync</span></div>
              <p className="text-white text-lg font-bold italic">"{profile.identityStatement}"</p>
            </div>
            <div className="space-y-4">
              {suggestedHabits.map((habit, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <input className="text-lg font-bold text-white bg-transparent outline-none w-full" value={habit.name} onChange={e => updateSuggestedHabit(idx, { name: e.target.value })} />
                    <button onClick={() => setSuggestedHabits(prev => prev.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-500"><Trash2 size={20}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-2xl"><label className="text-[10px] font-black text-slate-600 uppercase">Core Vector</label><p className="text-xs font-bold text-white">{habit.category}</p></div>
                    <div className="bg-black/20 p-3 rounded-2xl"><label className="text-[10px] font-black text-slate-600 uppercase">Sync Time</label><p className="text-xs font-bold text-white">{habit.time || 'All Day'}</p></div>
                  </div>
                </div>
              ))}
              <button onClick={() => setSuggestedHabits([...suggestedHabits, { name: 'New Node', category: 'Mindset', daysOfWeek: [1,2,3,4,5], time: '08:00' }])} className="w-full py-6 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 font-black flex items-center justify-center space-x-2 bg-white/5"><Plus size={18} /><span>Add Custom Node</span></button>
            </div>
            <div className="pt-8 sticky bottom-0 bg-[#0a0a0c] pb-8">
              <button onClick={finalizeOnboarding} className="w-full bg-cyan-500 text-black rounded-[2.5rem] py-6 font-black text-xl flex items-center justify-center space-x-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-95 relative z-20">
                <Check size={24} />
                <span>Activate Protocols</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;