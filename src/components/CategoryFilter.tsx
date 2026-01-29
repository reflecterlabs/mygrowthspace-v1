"use client";

import React from 'react';
import { getTranslation } from '../lib/translations';

const CATEGORIES = ['All', 'Health', 'Mindset', 'Productivity', 'Finance', 'Social'];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  language?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelect, language = 'en' }) => {
  const t = (key: any) => getTranslation(language, key);

  return (
    <div className="w-full py-2">
      {/* 
        - Grid de 3 columnas en móviles (grid-cols-3)
        - Flex scroll en pantallas medianas en adelante (sm:flex)
      */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-nowrap sm:overflow-x-auto sm:no-scrollbar sm:gap-3 outline-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-2 py-3 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 sm:flex-shrink-0 ${
              selectedCategory === cat 
                ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20 scale-[1.02] sm:scale-110 z-10' 
                : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white hover:bg-white/10'
            }`}
          >
            {t(cat.toLowerCase() as any)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;