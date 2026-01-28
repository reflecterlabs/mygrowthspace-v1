import React from 'react';

const CATEGORIES = ['All', 'Health', 'Mindset', 'Productivity', 'Finance', 'Social'];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelect }) => {
  return (
    <div className="flex items-center justify-center space-x-2 overflow-x-auto no-scrollbar pb-2 mb-4">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            selectedCategory === cat 
              ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/30' 
              : 'bg-white/5 text-slate-500 border border-white/5 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;