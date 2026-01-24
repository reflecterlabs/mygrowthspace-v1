import React from 'react';
import { SuggestedCard } from '../types';
import { Dumbbell, Clock, Target, X, Check } from 'lucide-react';

interface Props {
  card: SuggestedCard;
  onApply: (card: SuggestedCard) => void;
  onDismiss: (id: string) => void;
}

const SuggestedCardComponent: React.FC<Props> = ({ card, onApply, onDismiss }) => {
  const getIcon = () => {
    switch (card.type) {
      case 'schedule': return <Clock className="text-cyan-400" size={20} />;
      case 'priority': return <Target className="text-orange-500" size={20} />;
      default: return <Dumbbell className="text-cyan-400" size={20} />;
    }
  };

  return (
    <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 min-w-[280px] max-w-[300px] flex-shrink-0 animate-in slide-in-from-right-4 transition-transform hover:scale-[1.02] backdrop-blur-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
          {getIcon()}
        </div>
        <button onClick={() => onDismiss(card.id)} className="text-slate-600 hover:text-white p-1 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1.5 mb-2">
        <Dumbbell size={14} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Protocol Insight</span>
      </div>
      
      <h4 className="font-bold text-white text-base mb-2 leading-tight">{card.title}</h4>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">{card.description}</p>
      
      <button 
        onClick={() => onApply(card)}
        className="w-full bg-white text-black rounded-2xl py-4 text-xs font-black flex items-center justify-center space-x-2 hover:bg-cyan-500 transition-all active:scale-95"
      >
        <Check size={16} />
        <span>{card.actionLabel}</span>
      </button>
    </div>
  );
};

export default SuggestedCardComponent;