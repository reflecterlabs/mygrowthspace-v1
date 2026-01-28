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
      <div className="bg-[#1a1a1e]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="relative flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe cambios en tu protocolo..."
              className="w-full bg-transparent border-none text-sm text-white placeholder:text-slate-600 outline-none resize-none min-h-[45px] max-h-[120px] py-2 px-2 no-scrollbar font-medium"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="p-3 bg-cyan-500 text-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-lg shadow-cyan-500/20 mb-1 flex-shrink-0"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        
        <div className="absolute top-3 left-6 pointer-events-none opacity-20">
          <Sparkles size={12} className="text-cyan-400" />
        </div>
      </div>
    </div>
  );
};

export default RoutineInput;