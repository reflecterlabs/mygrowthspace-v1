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
      <div className="bg-[#1a1a1e]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative flex items-center space-x-3 pl-2">
          <div className="flex-1 flex items-center">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe cambios en tu protocolo..."
              className="w-full bg-transparent border-none text-[15px] leading-relaxed text-white placeholder:text-slate-500 outline-none resize-none py-3 no-scrollbar font-semibold tracking-tight"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
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
            className="w-12 h-12 flex-shrink-0 bg-cyan-500 text-black rounded-[1.25rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-lg shadow-cyan-500/20"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        
        <div className="absolute top-2 left-5 pointer-events-none opacity-30">
          <Sparkles size={14} className="text-cyan-400" />
        </div>
      </div>
    </div>
  );
};

export default RoutineInput;