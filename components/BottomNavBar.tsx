import React from 'react';
import { LayoutGrid, BarChart2, Plus } from 'lucide-react';

interface BottomNavBarProps {
  onHomeClick?: () => void;
  onInsightsClick?: () => void;
  onAddHabitClick?: () => void;
  currentView?: 'home' | 'insights';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onHomeClick,
  onInsightsClick,
  onAddHabitClick,
  currentView = 'home'
}) => {
  const navItems = [
    { id: 'home', label: 'Calendar', icon: LayoutGrid, onClick: onHomeClick },
    { id: 'insights', label: 'Metrics', icon: BarChart2, onClick: onInsightsClick },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/5 z-40">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-around relative">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all rounded-lg ${
                isActive
                  ? 'text-primary-500'
                  : 'text-slate-400 hover:text-primary-500'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={isActive ? 'drop-shadow-[0_0_8px_var(--primary-color)]' : ''}
              />
            </button>
          );
        })}
        
        <button
          onClick={onAddHabitClick}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary-500 text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95 shadow-primary-500/40 z-50"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;