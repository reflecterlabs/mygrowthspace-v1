import React from 'react';
import { Habit } from '../types';
import { CheckCircle, Circle, Flame, Trash2 } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  selectedDateStr: string;
  isSelectionMode?: boolean;
  isSelected?: boolean; // Esta prop no se utiliza en el componente
  onToggleSelection?: (id: string) => void;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  selectedDateStr, 
  onToggle, 
  onDelete, 
  onEdit,
  isSelectionMode,
  onToggleSelection
}) => {
  const isCompletedOnDate = habit.completedDates.includes(selectedDateStr);

  const handleClick = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(habit.id);
    } else {
      onEdit(habit);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`rounded-[2.5rem] p-6 border mb-3 transition-all flex items-center justify-between group relative overflow-hidden active:scale-[0.98] ${
        isCompletedOnDate 
          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      } cursor-pointer`}
    >
      <div className="flex items-center space-x-5 flex-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle(habit.id, selectedDateStr);
          }}
          className={`transition-all duration-300 flex-shrink-0 z-10 p-1 rounded-full ${
            isCompletedOnDate 
              ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' 
              : 'text-slate-700 hover:text-cyan-400'
          }`}
        >
          {isCompletedOnDate 
            ? <CheckCircle size={32} strokeWidth={2.5} /> 
            : <Circle size={32} strokeWidth={2} />
          }
        </button>

        <div className="flex-1">
          <h3 className={`font-bold text-white transition-all text-base tracking-tight ${isCompletedOnDate ? 'opacity-40 line-through' : ''}`}>
            {habit.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black mt-1">
            <span className="flex items-center text-orange-500 uppercase tracking-widest"><Flame size={12} className="mr-1" /> {habit.streak} STREAK</span>
            <span className="uppercase px-2 py-0.5 bg-white/5 rounded text-slate-500 border border-white/5">{habit.time || 'PROTOCOL ACTIVE'}</span>
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded uppercase">{habit.category}</span>
          </div>
        </div>
      </div>
      
      {!isSelectionMode && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(habit.id);
          }}
          className="text-slate-700 hover:text-red-500 transition-colors p-2 z-10"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};

export default HabitCard;