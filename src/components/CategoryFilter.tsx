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
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 px-1 snap-x snap-mandatory scroll-smooth outline-none">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all snap-start ${
            selectedCategory === cat 
              ? 'bg-primary-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105 z-10' 
              : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white hover:bg-white/10'
          }`}
        >
          {t(cat.toLowerCase() as any)}
        </button>
      ))}
      {/* Espaciador final para permitir scroll completo */}
      <div className="flex-shrink-0 w-4" aria-hidden="true" />
    </div>
  );
};

export default CategoryFilter;