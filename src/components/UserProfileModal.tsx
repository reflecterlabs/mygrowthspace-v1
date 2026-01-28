"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Download, Trash2, LogOut, AlertCircle, Check, Settings, Palette, Plus, Save, Globe } from 'lucide-react';
import { UserProfile } from '../../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
// import CreateWallet from '../../components/CreateWallet';
// import Transfer from '../../components/Transfer';
import { getTranslation } from '../lib/translations';

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
  { code: 'hi', name: 'हिंदी' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
];

type TabType = 'profile' | 'finance';

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onDownloadData,
  onDeleteAccount,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [editingName, setEditingName] = useState(userProfile.name);
  const [pendingColor, setPendingColor] = useState(userProfile.themeColor || '#06b6d4');
  const [pendingLanguage, setPendingLanguage] = useState(userProfile.language || 'en');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const t = (key: any) => getTranslation(userProfile.language, key);

  useEffect(() => {
    if (isOpen) {
      setEditingName(userProfile.name);
      setPendingColor(userProfile.themeColor || '#06b6d4');
      setPendingLanguage(userProfile.language || 'en');
      setActiveTab('profile');
    }
  }, [isOpen, userProfile.name, userProfile.themeColor, userProfile.language]);

  const handlePreviewColor = (hex: string) => {
    setPendingColor(hex);
    document.documentElement.style.setProperty('--primary-color', hex);
  };

  const handleSaveTheme = async () => {
    const toastId = showLoading(t('toastSavingVisuals'));
    try {
      await onUpdateProfile({ themeColor: pendingColor });
      showSuccess(t('toastVisualsRecalibrated'));
    } catch (e) {
      showError('Failed to update theme');
    } finally { dismissToast(toastId); }
  };

  const handleSaveLanguage = async (lang: string) => {
    setPendingLanguage(lang);
    try {
      await onUpdateProfile({ language: lang });
      showSuccess('Language updated!');
    } catch (error) {
      showError('Failed to update language');
    }
  };

  const handleSaveName = async () => {
    if (editingName.trim() === userProfile.name || editingName.trim() === '') return;
    try {
      await onUpdateProfile({ name: editingName.trim() });
      showSuccess('Username updated!');
    } catch (error) {
      showError('Failed to update name');
    }
  };

  if (!isOpen) return null;

  const isPresetColor = COLORS.some(c => c.hex.toLowerCase() === pendingColor.toLowerCase());
  const hasColorChanges = pendingColor.toLowerCase() !== (userProfile.themeColor || '#06b6d4').toLowerCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0a0c] w-full max-w-md border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white z-20">
          <X size={24} />
        </button>

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-primary-500 mb-2">
            <Settings size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('settingsProtocol')}</span>
          </div>
          <h2 className="text-2xl font-black text-white">{t('settingsTitle')}</h2>
        </div>

        {/* Tab Switcher hidden for now */}
        {/* 
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-primary-500 text-black' : 'text-slate-500'}`}
          >
            {t('settingsGeneral')}
          </button>
          <button 
            onClick={() => setActiveTab('finance')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-primary-500 text-black' : 'text-slate-500'}`}
          >
            {t('settingsFinance')}
          </button>
        </div>
        */}

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-4">
          {activeTab === 'profile' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <User size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('settingsIdentity')}</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-2xl p-1 pr-4">
                  <input className="bg-transparent text-white outline-none font-bold w-full p-3" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  <button onClick={handleSaveName} className="bg-primary-500/20 text-primary-500 p-2 rounded-xl"><Check size={18} /></button>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Globe size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('settingsLanguage')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(lang => (
                    <button 
                      key={lang.code}
                      onClick={() => handleSaveLanguage(lang.code)}
                      className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${pendingLanguage === lang.code ? 'bg-primary-500 text-black border-primary-500' : 'bg-white/5 text-slate-500 border-white/5'}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Palette size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('settingsSelectColor')}</span>
                </div>
                <div className="flex gap-4 flex-wrap items-center">
                  {COLORS.map(c => (
                    <button 
                      key={c.hex} 
                      onClick={() => handlePreviewColor(c.hex)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${pendingColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  
                  <div className="relative">
                    <button 
                      onClick={() => colorInputRef.current?.click()}
                      className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${!isPresetColor ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: !isPresetColor ? pendingColor : 'transparent' }}
                    >
                      <Plus size={18} className={!isPresetColor ? 'text-white' : 'text-slate-500'} />
                    </button>
                    <input 
                      ref={colorInputRef}
                      type="color"
                      className="absolute inset-0 opacity-0 pointer-events-none"
                      value={pendingColor}
                      onChange={(e) => handlePreviewColor(e.target.value)}
                    />
                  </div>
                </div>

                {hasColorChanges && (
                  <button 
                    onClick={handleSaveTheme}
                    className="w-full bg-primary-500 text-black rounded-2xl py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 animate-in slide-in-from-bottom-2"
                  >
                    <Save size={16} />
                    <span>{t('settingsTheme')}</span>
                  </button>
                )}
              </section>

              <section className="pt-8 border-t border-white/5 space-y-3">
                <button onClick={onDownloadData} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white font-black text-sm flex items-center justify-center space-x-2"><Download size={18} /><span>{t('settingsArchive')}</span></button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowLogoutConfirm(true)} className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 text-red-400 font-black text-sm flex items-center justify-center space-x-2"><LogOut size={16} /><span>{t('settingsSignOut')}</span></button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 text-red-500 font-black text-sm flex items-center justify-center space-x-2"><Trash2 size={16} /><span>{t('settingsTerminate')}</span></button>
                </div>
              </section>
            </div>
          ) : (
            /* Finance section hidden but logic preserved */
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              {/* <CreateWallet language={userProfile.language} /> */}
              {/* <Transfer language={userProfile.language} /> */}
              <div className="text-center p-8 text-slate-500 font-black uppercase tracking-widest text-xs">
                Finances Module Offline
              </div>
            </div>
          )}
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">{t('settingsConfirmLogout')}</h3>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black">{t('cancel')}</button>
                <button onClick={onLogout} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black">{t('confirm')}</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">{t('deleteHabitTitle')}</h3>
              <p className="text-slate-400 text-sm mb-8">{t('settingsIrreversible')}</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black">{t('cancel')}</button>
                <button onClick={onDeleteAccount} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black">{t('confirm')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;