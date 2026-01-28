import React from 'react';
import { Sparkles } from 'lucide-react';

interface ManifestHeaderProps {
  statement: string;
}

const ManifestHeader: React.FC<ManifestHeaderProps> = ({ statement }) => {
  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center space-x-2 text-slate-500 mb-2">
        <Sparkles size={14} className="text-primary-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">Person's Manifest</span>
      </div>
      <div className="bg-gradient-to-r from-white/5 to-transparent border-l-2 border-primary-500 p-4 rounded-r-2xl">
        <p className="text-xl font-black text-white italic tracking-tight leading-tight">
          "{statement || 'I am forging my new self.'}"
        </p>
      </div>
    </div>
  );
};

export default ManifestHeader;