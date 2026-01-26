import React from 'react';
import { LayoutGrid, BarChart2 } from 'lucide-react'; // Iconos actualizados, User eliminado

interface BottomNavBarProps {
  onHomeClick?: () => void;
  onInsightsClick?: () => void;
  currentView?: 'home' | 'insights'; // 'profile' eliminado
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onHomeClick,
  onInsightsClick,
  currentView = 'home'
}) => {
  const navItems = [
    { id: 'home', label: 'Calendar', icon: LayoutGrid, onClick: onHomeClick }, // Icono de cuadrícula para Calendar
    { id: 'insights', label: 'Metrics', icon: BarChart2, onClick: onInsightsClick }, // Icono de gráfico de barras para Metrics
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/5 z-40">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-around">
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
              {/* Eliminado el texto de la etiqueta para que coincida con la imagen */}
              {/* <span className={`text-[9px] font-black uppercase tracking-widest mt-1`}>
                {item.label}
              </span> */}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;