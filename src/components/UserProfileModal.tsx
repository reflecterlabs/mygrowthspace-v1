import React, { useState, useEffect, useRef } from 'react';
import { X, User, Download, Trash2, LogOut, AlertCircle, Check, Settings, Palette, Plus } from 'lucide-react';
import { UserProfile } from '../../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import CreateWallet from '../../components/CreateWallet';
import Transfer from '../../components/Transfer';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingName(userProfile.name);
      setActiveTab('profile');
    }
  }, [isOpen, userProfile.name]);

  const handleUpdateColor = async (hex: string) => {
    const toastId = showLoading('Switching visuals...');
    try {
      document.documentElement.style.setProperty('--primary-color', hex);
      await onUpdateProfile({ themeColor: hex });
      showSuccess(`Visual system recalibrated.`);
    } catch (e) {
      showError('Failed to update theme');
    } finally { dismissToast(toastId); }
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

  const isPresetColor = COLORS.some(c => c.hex.toLowerCase() === userProfile.themeColor?.toLowerCase());

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
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Management</span>
          </div>
          <h2 className="text-2xl font-black text-white">System Settings</h2>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-primary-500 text-black' : 'text-slate-500'}`}>General</button>
          <button onClick={() => setActiveTab('finance')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-orange-500 text-black' : 'text-slate-500'}`}>Finanzas</button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-4">
          {activeTab === 'profile' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <User size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Identity</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-2xl p-1 pr-4">
                  <input className="bg-transparent text-white outline-none font-bold w-full p-3" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  <button onClick={handleSaveName} className="bg-primary-500/20 text-primary-500 p-2 rounded-xl"><Check size={18} /></button>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500">
                  <Palette size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Select your Colour</span>
                </div>
                <div className="flex gap-4 flex-wrap items-center">
                  {COLORS.map(c => (
                    <button 
                      key={c.hex} 
                      onClick={() => handleUpdateColor(c.hex)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${userProfile.themeColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  
                  {/* Selector de color personalizado */}
                  <div className="relative">
                    <button 
                      onClick={() => colorInputRef.current?.click()}
                      className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${!isPresetColor ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: !isPresetColor ? userProfile.themeColor : 'transparent' }}
                    >
                      <Plus size={18} className={!isPresetColor ? 'text-white' : 'text-slate-500'} />
                    </button>
                    <input 
                      ref={colorInputRef}
                      type="color"
                      className="absolute inset-0 opacity-0 pointer-events-none"
                      value={userProfile.themeColor || '#06b6d4'}
                      onChange={(e) => handleUpdateColor(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="pt-8 border-t border-white/5 space-y-3">
                <button onClick={onDownloadData} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white font-black text-sm flex items-center justify-center space-x-2"><Download size={18} /><span>Archive Data Package</span></button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowLogoutConfirm(true)} className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 text-red-400 font-black text-sm flex items-center justify-center space-x-2"><LogOut size={16} /><span>Sign Out</span></button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 text-red-500 font-black text-sm flex items-center justify-center space-x-2"><Trash2 size={16} /><span>Terminate</span></button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <CreateWallet />
              <Transfer />
            </div>
          )}
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">Confirm Logout</h3>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black">No</button>
                <button onClick={onLogout} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black">Yes</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">Delete Account?</h3>
              <p className="text-slate-400 text-sm mb-8">This action is irreversible.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-2xl text-white font-black">Cancel</button>
                <button onClick={onDeleteAccount} className="flex-1 py-3 bg-red-500/20 rounded-2xl text-red-400 font-black">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;