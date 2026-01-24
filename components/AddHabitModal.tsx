import React, { useState } from 'react';
import { X, Check, Dumbbell, Clock } from 'lucide-react';
import { Habit } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Partial<Habit>) => void;
}

const CATEGORIES = ['Health', 'Mindset', 'Productivity', 'Finance', 'Social'];

const AddHabitModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Mindset');
  const [time, setTime] = useState('08:00');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0a0c] w-full max-w-md border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Dumbbell size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">New Node</span>
          </div>
          <h2 className="text-2xl font-black text-white">Initialize Protocol</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Identity Action</label>
            <input 
              autoFocus
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 transition-all font-bold placeholder:text-slate-800"
              placeholder="e.g. 20m Morning Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Vector Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase transition-all ${category === cat ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Synchronization Time</label>
            <div className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-2xl p-4">
              <Clock size={20} className="text-slate-600" />
              <input 
                type="time" 
                className="bg-transparent text-white outline-none font-bold w-full"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={!name}
            onClick={() => onSave({ name, category, time, daysOfWeek: [1,2,3,4,5], frequency: 'daily' })}
            className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center space-x-2 hover:bg-cyan-500 transition-all active:scale-95 disabled:opacity-20 mt-4 shadow-xl"
          >
            <Check size={24} />
            <span>Deploy Protocol</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHabitModal;