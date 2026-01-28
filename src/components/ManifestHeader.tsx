import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { getTranslation } from '../lib/translations';

interface ManifestHeaderProps {
  statement: string;
  onUpdate: (newStatement: string) => void;
  language?: string;
}

const ManifestHeader: React.FC<ManifestHeaderProps> = ({ statement, onUpdate, language = 'en' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(statement);
  const t = (key: any) => getTranslation(language, key);

  const handleSave = () => {
    onUpdate(tempValue);
    setIsEditing(false);
  };

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center space-x-2 text-slate-500 mb-2">
        <Sparkles size={14} className="text-primary-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t('manifestTitle')}</span>
      </div>
      
      {isEditing ? (
        <div className="bg-white/5 border border-primary-500/50 p-4 rounded-2xl flex items-center gap-3">
          <textarea
            autoFocus
            className="flex-1 bg-transparent border-none text-lg font-black text-white italic outline-none resize-none"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            rows={2}
          />
          <div className="flex flex-col gap-2">
            <button onClick={handleSave} className="p-2 bg-primary-500 text-black rounded-lg"><Check size={16}/></button>
            <button onClick={() => setIsEditing(false)} className="p-2 bg-white/10 text-slate-400 rounded-lg"><X size={16}/></button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => { setTempValue(statement); setIsEditing(true); }}
          className="bg-gradient-to-r from-white/5 to-transparent border-l-2 border-primary-500 p-4 rounded-r-2xl cursor-pointer hover:bg-white/10 transition-colors group"
        >
          <p className="text-xl font-black text-white italic tracking-tight leading-tight group-hover:text-primary-500 transition-colors">
            "{statement || 'I am forging my new self.'}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ManifestHeader;