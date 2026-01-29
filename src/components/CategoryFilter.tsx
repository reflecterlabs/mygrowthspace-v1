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
    /* py-8 proporciona espacio de sobra para la sombra y la escala. 
       -my-4 compensa ese espacio para que el diseño no se vea demasiado separado. */
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-8 -my-4 px-1 snap-x snap-mandatory scroll-smooth outline-none">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 snap-start ${
            selectedCategory === cat 
              ? 'bg-primary-500 text-black shadow-[0_10px_30px_-5px_var(--primary-color)] scale-110 z-10' 
              : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white hover:bg-white/10'
          }`}
        >
          {t(cat.toLowerCase() as any)}
        </button>
      ))}
      {/* Espaciador para asegurar que el último elemento no se pegue al borde derecho al scrollear */}
      <div className="flex-shrink-0 w-8" aria-hidden="true" />
    </div>
  );
};

export default CategoryFilter;