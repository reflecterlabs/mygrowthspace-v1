import React from 'react';
import { Habit } from '../types';
import { CheckCircle, Circle, Flame, Trash2, Heart, Brain, Zap, DollarSign, Users } from 'lucide-react';
import { getTranslation } from '../src/lib/translations';

interface HabitCardProps {
  habit: Habit;
  selectedDateStr: string;
  isSelectionMode?: boolean;
  onToggleSelection?: (id: string) => void;
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  language?: string;
}

const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  selectedDateStr, 
  onToggle, 
  onDelete, 
  onEdit,
  isSelectionMode,
  onToggleSelection,
  language = 'en'
}) => {
  const isCompletedOnDate = habit.completedDates.includes(selectedDateStr);
  const t = (key: any) => getTranslation(language, key);

  const getCategoryIcon = () => {
    switch (habit.category) {
      case 'Health': return <Heart size={12} className="sm:size-[14px]" />;
      case 'Mindset': return <Brain size={12} className="sm:size-[14px]" />;
      case 'Productivity': return <Zap size={12} className="sm:size-[14px]" />;
      case 'Finance': return <DollarSign size={12} className="sm:size-[14px]" />;
      case 'Social': return <Users size={12} className="sm:size-[14px]" />;
      default: return <Flame size={12} className="sm:size-[14px]" />;
    }
  };

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
      className={`rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 border mb-2 sm:mb-3 transition-all flex items-center justify-between group relative overflow-hidden active:scale-[0.98] ${
        isCompletedOnDate 
          ? 'bg-primary-500/10 border-primary-500/40 shadow-lg shadow-primary-500/5' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      } cursor-pointer`}
    >
      <div className="flex items-center space-x-3 sm:space-x-5 flex-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggle(habit.id, selectedDateStr);
          }}
          className={`transition-all duration-300 flex-shrink-0 z-10 p-0.5 sm:p-1 rounded-full ${
            isCompletedOnDate 
              ? 'text-primary-500 scale-110 drop-shadow-[0_0_8px_var(--primary-color)]' 
              : 'text-slate-700 hover:text-primary-500'
          }`}
        >
          {isCompletedOnDate 
            ? <CheckCircle size={28} className="sm:size-8" strokeWidth={2.5} /> 
            : <Circle size={28} className="sm:size-8" strokeWidth={2} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-white transition-all text-sm sm:text-base tracking-tight truncate ${isCompletedOnDate ? 'opacity-40 line-through' : ''}`}>
            {habit.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[8px] sm:text-[10px] font-black mt-0.5 sm:mt-1">
            <span className="flex items-center text-orange-500 uppercase tracking-widest">
              <Flame size={10} className="sm:size-3 mr-1" /> {habit.streak} {t('habitStreak')}
            </span>
            <span className="uppercase px-1.5 py-0.5 bg-white/5 rounded text-slate-500 border border-white/5">
              {habit.time || t('habitProtocolActive')}
            </span>
            <span className="bg-primary-500/20 text-primary-500 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
              {getCategoryIcon()}
              {t(habit.category.toLowerCase() as any)}
            </span>
          </div>
        </div>
      </div>
      
      {!isSelectionMode && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(habit.id);
          }}
          className="text-slate-700 hover:text-red-500 transition-colors p-1 sm:p-2 z-10 ml-2"
        >
          <Trash2 size={16} className="sm:size-[18px]" />
        </button>
      )}
    </div>
  );
};

export default HabitCard;