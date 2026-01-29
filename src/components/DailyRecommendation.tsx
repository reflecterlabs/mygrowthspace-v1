"use client";

import React from 'react';
import { Sparkles, X, Lightbulb, Clock, TrendingUp } from 'lucide-react';
import { MotivationTip } from '../../types';
import { getTranslation } from '../lib/translations';

interface DailyRecommendationProps {
  recommendation: MotivationTip;
  onDismiss: () => void;
  language?: string;
}

const DailyRecommendation: React.FC<DailyRecommendationProps> = ({ recommendation, onDismiss, language = 'en' }) => {
  const t = (key: any) => getTranslation(language, key);

  return (
    <div className="bg-gradient-to-br from-primary-500/20 via-primary-500/5 to-transparent border border-primary-500/30 rounded-[2.5rem] p-6 mb-6 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-4">
        <button 
          onClick={onDismiss}
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-2 text-primary-500 mb-4">
        <Sparkles size={18} className="drop-shadow-[0_0_8px_var(--primary-color)]" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t('recommendationTitle')}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary-500/10 p-3 rounded-2xl text-primary-500">
            <Lightbulb size={24} />
          </div>
          <div className="flex-1">
            <p className="text-white text-lg font-black leading-tight tracking-tight mb-2 italic">
              "{recommendation.quote}"
            </p>
            <p className="text-primary-500/60 text-xs font-black uppercase tracking-widest">— {recommendation.author}</p>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="text-orange-500"><Clock size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-300">
              {recommendation.actionStep}
            </p>
          </div>
        </div>
        
        <button 
          onClick={onDismiss}
          className="w-full bg-primary-500 text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary-500/20"
        >
          <TrendingUp size={14} />
          <span>{t('recommendationDismiss')}</span>
        </button>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-1000" />
    </div>
  );
};

export default DailyRecommendation;