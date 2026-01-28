import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

interface RoutineInputProps {
  onAnalyze: (text: string) => Promise<void>;
  isLoading: boolean;
}

const RoutineInput: React.FC<RoutineInputProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) return;
    await onAnalyze(text);
    setText('');
  };

  return (
    <div className="fixed bottom-28 left-6 right-6 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#1a1a1e]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative flex items-center space-x-4 pl-3">
          <div className="flex-1 flex items-center">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe nuevos hábitos y modificaciones"
              className="w-full bg-transparent border-none text-[18px] leading-snug text-white placeholder:text-slate-600 outline-none resize-none py-2 no-scrollbar font-bold tracking-tight"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="w-14 h-14 flex-shrink-0 bg-primary-500 text-black rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-xl shadow-primary-500/30"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
        
        <div className="absolute top-2 left-6 pointer-events-none opacity-40">
          <Sparkles size={16} className="text-primary-500" />
        </div>
      </div>
    </div>
  );
};

export default RoutineInput;