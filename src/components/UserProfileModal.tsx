"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Trash2, LogOut, AlertCircle, Check, Settings, Palette, Plus, Save, Globe, Shield } from 'lucide-react';
import { UserProfile } from '../../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
// import CreateWallet from '../../components/CreateWallet';
// import Transfer from '../../components/Transfer';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onDownloadData: () => void;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => Promise<void>;
}

const COLORS = [
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

// type TabType = 'profile' | 'finance';

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onDownloadData,
  onDeleteAccount,
  onLogout,
}) => {
  // const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [editingName, setEditingName] = useState(userProfile.name);
  const [pendingColor, setPendingColor] = useState(userProfile.themeColor || '#06b6d4');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingName(userProfile.name);
      setPendingColor(userProfile.themeColor || '#06b6d4');
      // setActiveTab('profile');
    }
  }, [isOpen, userProfile.name, userProfile.themeColor]);

  if (!isOpen) return null;

  const handlePreviewColor = (hex: string) => {
    setPendingColor(hex);
    document.documentElement.style.setProperty('--primary-color', hex);
  };

  const handleSaveTheme = async () => {
    const toastId = showLoading('Recalibrating visuals...');
    try {
      await onUpdateProfile({ themeColor: pendingColor });
      showSuccess('Visual system updated.');
    } catch (e) {
      showError('Failed to update theme');
    } finally { dismissToast(toastId); }
  };

  const handleSaveLanguage = async (lang: string) => {
    try {
      await onUpdateProfile({ language: lang });
      showSuccess('Language synchronized.');
    } catch (error) {
      showError('Failed to update language');
    }
  };

  const handleSaveName = async () => {
    if (editingName.trim() === userProfile.name || editingName.trim() === '') return;
    try {
      await onUpdateProfile({ name: editingName.trim() });
      showSuccess('Identity designation updated.');
    } catch (error) {
      showError('Failed to update name');
    }
  };

  const handleDeleteConfirmed = async () => {
    const toastId = showLoading('Terminating account...');
    try {
      await onDeleteAccount();
      showSuccess('Account terminated.');
      onClose();
    } catch (e) {
      showError('Failed to terminate account.');
    } finally { dismissToast(toastId); }
  };

  const isPresetColor = COLORS.some(c => c.hex.toLowerCase() === pendingColor.toLowerCase());
  const hasColorChanges = pendingColor.toLowerCase() !== (userProfile.themeColor || '#06b6d4').toLowerCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0a0c] w-full max-w-md border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-500 hover:text-white z-20 p-2">
          <X size={24} />
        </button>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 text-primary-500 mb-1 sm:mb-2">
            <Settings size={18} className="sm:size-5" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">System Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 sm:space-y-8 pb-2">
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Identity Section */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 text-slate-500">
                <Shield size={12} className="sm:size-3.5 text-primary-500" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Identity Sync</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 border border-white/5 rounded-2xl p-1 pr-3 sm:pr-4">
                <input className="bg-transparent text-white outline-none font-bold w-full p-2.5 sm:p-3 text-sm sm:text-base" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                <button onClick={handleSaveName} className="bg-primary-500/20 text-primary-500 p-1.5 sm:p-2 rounded-xl flex-shrink-0"><Check size={16} className="sm:size-[18px]" /></button>
              </div>
            </section>

            {/* Language Section */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 text-slate-500">
                <Globe size={12} className="sm:size-3.5 text-primary-500" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Linguistic Protocol</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => handleSaveLanguage(lang.code)}
                    className={`py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${userProfile.language === lang.code ? 'bg-primary-500 text-black border-primary-500' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme Section */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 text-slate-500">
                <Palette size={12} className="sm:size-3.5 text-primary-500" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Visual Matrix</span>
              </div>
              <div className="flex gap-3 sm:gap-4 flex-wrap items-center">
                {COLORS.map(c => (
                  <button 
                    key={c.hex} 
                    onClick={() => handlePreviewColor(c.hex)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${pendingColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <div className="relative">
                  <button 
                    onClick={() => colorInputRef.current?.click()}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${!isPresetColor ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: !isPresetColor ? pendingColor : 'transparent' }}
                  >
                    <Plus size={16} className={!isPresetColor ? 'text-white' : 'text-slate-500'} />
                  </button>
                  <input ref={colorInputRef} type="color" className="absolute inset-0 opacity-0 pointer-events-none" value={pendingColor} onChange={(e) => handlePreviewColor(e.target.value)} />
                </div>
              </div>
              {hasColorChanges && (
                <button onClick={handleSaveTheme} className="w-full bg-primary-500 text-black rounded-2xl py-3 sm:py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center space-x-2 animate-in slide-in-from-bottom-2">
                  <Save size={14} className="sm:size-4" />
                  <span>Apply Theme Configuration</span>
                </button>
              )}
            </section>

            {/* Danger Zone */}
            <section className="pt-6 sm:pt-8 border-t border-white/5 space-y-2 sm:space-y-3">
              <button onClick={onDownloadData} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 sm:py-4 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2"><Download size={16} className="sm:size-[18px]" /><span>Archive Data Package</span></button>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button onClick={() => setShowLogoutConfirm(true)} className="bg-red-500/10 border border-red-500/20 rounded-2xl py-3.5 sm:py-4 text-red-400 font-black text-xs sm:text-sm flex items-center justify-center space-x-2"><LogOut size={14} className="sm:size-[16px]" /><span>Sign Out</span></button>
                <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/20 border border-red-500/30 rounded-2xl py-3.5 sm:py-4 text-red-500 font-black text-xs sm:text-sm flex items-center justify-center space-x-2"><Trash2 size={14} className="sm:size-[16px]" /><span>Terminate</span></button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 sm:p-8 max-sm w-full text-center">
            <AlertCircle size={32} className="sm:size-10 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4">Confirm Logout</h3>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black text-sm">Cancel</button>
              <button onClick={onLogout} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 sm:p-8 max-sm w-full text-center">
            <AlertCircle size={32} className="sm:size-10 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">Terminate Account?</h3>
            <p className="text-slate-400 text-[10px] sm:text-xs mb-6 sm:mb-8">This action is irreversible. All your data will be permanently deleted.</p>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black text-sm">Cancel</button>
              <button onClick={handleDeleteConfirmed} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black text-sm">Terminate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;