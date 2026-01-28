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
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex items-center space-x-2 text-cyan-400 mb-4">
        <Sparkles size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Neural Input</span>
      </div>
      
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe un cambio en tu rutina o nuevos objetivos..."
          className="w-full bg-black/20 border border-white/5 rounded-3xl p-5 pr-14 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 transition-all min-h-[100px] resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="absolute bottom-4 right-4 p-3 bg-cyan-500 text-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-lg shadow-cyan-500/20"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
      <p className="text-[9px] text-slate-500 mt-3 font-bold uppercase tracking-tighter ml-2">
        La IA analizará tu texto para optimizar tus protocolos actuales.
      </p>
    </div>
  );
};

export default RoutineInput;