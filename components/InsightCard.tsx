import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { Habit, SuggestedCard } from '../types';

interface Props {
  suggestion: SuggestedCard | (SuggestedCard & { payload?: Partial<Habit> });
  onAccept: (habit: Partial<Habit>) => void;
  onReject: () => void;
}

const InsightCard: React.FC<Props> = ({ suggestion, onAccept, onReject }) => {
  const payload: Partial<Habit> | undefined =
    // prefer explicit suggestedAction.payload (AI schema), fall back to legacy payload
    (suggestion as any).suggestedAction?.payload || (suggestion as any).payload;
  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-[2rem] p-6 mb-6 animate-in slide-in-from-top duration-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Neural Suggestion</span>
        </div>
        <button onClick={onReject} className="text-slate-500 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <h3 className="text-lg font-black text-white mb-2">{suggestion.title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        {suggestion.description}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => payload && onAccept(payload)}
          className="flex-1 bg-cyan-500 text-black py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all disabled:opacity-40"
          disabled={!payload}
        >
          <Plus size={16} strokeWidth={3} />
          Sync to Routine
        </button>
      </div>
    </div>
  );
};

export default InsightCard;