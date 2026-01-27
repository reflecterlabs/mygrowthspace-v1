import React from 'react';
import { LayoutGrid, BarChart2, Plus } from 'lucide-react'; // Iconos actualizados

interface BottomNavBarProps {
  onHomeClick?: () => void;
  onInsightsClick?: () => void;
  onAddHabitClick?: () => void; // Nueva prop para el botón de añadir hábito
  currentView?: 'home' | 'insights';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onHomeClick,
  onInsightsClick,
  onAddHabitClick, // Recibir la nueva prop
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
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={'group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'}
              />
            </button>
          );
        })}
        
        {/* Botón central de Añadir Hábito */}
        <button
          onClick={onAddHabitClick}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] z-50"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;