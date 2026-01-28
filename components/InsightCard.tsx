import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { Habit, SuggestedCard } from '../types';
import { getTranslation } from '../src/lib/translations';

interface Props {
  suggestion: SuggestedCard | (SuggestedCard & { payload?: Partial<Habit> });
  onAccept: (habit: Partial<Habit>) => void;
  onReject: () => void;
  language?: string;
}

const InsightCard: React.FC<Props> = ({ suggestion, onAccept, onReject, language = 'en' }) => {
  const t = (key: any) => getTranslation(language, key);
  const payload: Partial<Habit> | undefined =
    (suggestion as any).suggestedAction?.payload || (suggestion as any).payload;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 sm:p-5 mb-4 animate-in slide-in-from-top duration-500 backdrop-blur-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-primary-500">
          <Sparkles size={16} className="drop-shadow-[0_0_8px_var(--primary-color)]" />
          <span className="text-[9px] font-black uppercase tracking-widest">{t('neuralSuggestion')}</span>
        </div>
        <button onClick={onReject} className="text-slate-500 hover:text-white transition-colors p-1">
          <X size={16} />
        </button>
      </div>
      
      <h3 className="text-base font-black text-white mb-1.5 leading-tight">{suggestion.title}</h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed font-medium">
        {suggestion.description}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => payload && onAccept(payload)}
          className="flex-1 bg-primary-500 text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
          disabled={!payload}
        >
          <Plus size={14} strokeWidth={3} />
          {t('syncToRoutine')}
        </button>
      </div>
    </div>
  );
};

export default InsightCard;