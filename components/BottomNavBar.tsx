import React from 'react';
import { Home, Sparkles, User, Plus } from 'lucide-react';

interface BottomNavBarProps {
  onAddClick: () => void;
  onHomeClick?: () => void;
  onInsightsClick?: () => void;
  onProfileClick?: () => void;
  currentView?: 'home' | 'insights' | 'profile';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onAddClick,
  onHomeClick,
  onInsightsClick,
  onProfileClick,
  currentView = 'home'
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, onClick: onHomeClick },
    { id: 'insights', label: 'Insights', icon: Sparkles, onClick: onInsightsClick },
    { id: 'add', label: 'Add', icon: Plus, onClick: onAddClick },
    { id: 'profile', label: 'Profile', icon: User, onClick: onProfileClick }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/5 z-40">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isAddBtn = item.id === 'add';

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all rounded-lg ${
                isAddBtn
                  ? 'bg-white text-black hover:bg-cyan-400 hover:shadow-lg'
                  : isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <Icon
                size={isAddBtn ? 24 : 20}
                strokeWidth={isAddBtn ? 3 : 2}
                className={isAddBtn ? '' : 'group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                isAddBtn ? 'text-black font-black' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
