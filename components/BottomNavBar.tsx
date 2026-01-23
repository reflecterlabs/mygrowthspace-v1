import React from 'react';
import { Home, Sparkles, User, Plus } from 'lucide-react';

interface BottomNavBarProps {
  onAddClick: () => void;
  onHomeClick?: () => void;
  onInsightsClick?: () => void;
  onProfileClick?: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onAddClick,
  onHomeClick,
  onInsightsClick,
  onProfileClick
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/5 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={onHomeClick}
          className="flex-1 flex flex-col items-center justify-center py-3 text-slate-400 hover:text-cyan-400 transition-colors gap-1 group"
        >
          <Home size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>

        <button
          onClick={onInsightsClick}
          className="flex-1 flex flex-col items-center justify-center py-3 text-slate-400 hover:text-cyan-400 transition-colors gap-1 group"
        >
          <Sparkles size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
        </button>

        <button
          onClick={onAddClick}
          className="w-14 h-14 -mt-3 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl hover:shadow-2xl"
        >
          <Plus size={24} strokeWidth={3} />
        </button>

        <button
          onClick={onProfileClick}
          className="flex-1 flex flex-col items-center justify-center py-3 text-slate-400 hover:text-cyan-400 transition-colors gap-1 group"
        >
          <User size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;
