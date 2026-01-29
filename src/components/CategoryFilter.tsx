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
    <div className="w-full flex justify-center py-2">
      {/* 
        flex-wrap: permite que los botones bajen a la siguiente fila en pantallas pequeñas.
        justify-center: mantiene los botones centrados en cualquier resolución.
      */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`
              px-4 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest 
              transition-all duration-300 border
              ${selectedCategory === cat 
                ? 'bg-primary-500 text-black border-primary-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.05]' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300'
              }
            `}
          >
            {t(cat.toLowerCase() as any)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;