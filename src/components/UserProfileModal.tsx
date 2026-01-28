import React, { useState, useEffect } from 'react';
import { X, User, Download, Trash2, LogOut, AlertCircle, Check, Loader2, Wallet as WalletIcon, Shield, Settings } from 'lucide-react';
import { UserProfile } from '../../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import CreateWallet from '../../components/CreateWallet';
import Transfer from '../../components/Transfer';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (newName: string) => Promise<void>;
  onDownloadData: () => void;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => Promise<void>;
}

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
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingName(userProfile.name);
      setShowDeleteConfirm(false);
      setShowLogoutConfirm(false);
      setActiveTab('profile'); // Reset to first tab when opening
    }
  }, [isOpen, userProfile.name]);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (editingName.trim() === userProfile.name || editingName.trim() === '') return;
    setIsSavingName(true);
    const toastId = showLoading('Updating username...');
    try {
      await onUpdateProfile(editingName.trim());
      showSuccess('Username updated successfully!');
    } catch (error) {
      showError('Failed to update username.');
      console.error("UserProfileModal: Error updating profile name:", error);
    } finally {
      dismissToast(toastId);
      setIsSavingName(false);
    }
  };

  const handleDownload = () => {
    onDownloadData();
  };

  const handleDeleteAccountConfirmed = async () => {
    setIsDeletingAccount(true);
    const toastId = showLoading('Deleting account...');
    try {
      await onDeleteAccount();
      showSuccess('Account deleted successfully!');
      onClose();
    } catch (error) {
      showError('Failed to delete account.');
      console.error("UserProfileModal: Error deleting account:", error);
    } finally {
      dismissToast(toastId);
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogoutConfirmed = async () => {
    setIsLoggingOut(true);
    const toastId = showLoading('Logging out...');
    try {
      await onLogout();
      showSuccess('Logged out successfully!');
      onClose();
    } catch (error) {
      showError('Failed to log out.');
      console.error("UserProfileModal: Error logging out:", error);
    } finally {
      dismissToast(toastId);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0a0a0c] w-full max-w-md border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white z-20">
          <X size={24} />
        </button>

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Settings size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Management</span>
          </div>
          <h2 className="text-2xl font-black text-white">System Settings</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'profile' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            <User size={14} />
            <span>General</span>
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'finance' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            <WalletIcon size={14} />
            <span>Finanzas</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-4">
          {activeTab === 'profile' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              {/* Identity Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <Shield size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Identity Sync</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Display Name</label>
                  <div className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-2xl p-1 pr-4">
                    <input 
                      className="bg-transparent text-white outline-none font-bold w-full p-3"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={isSavingName}
                    />
                    <button 
                      onClick={handleSaveName}
                      disabled={editingName.trim() === userProfile.name || editingName.trim() === '' || isSavingName}
                      className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl hover:bg-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isSavingName ? <Check size={18} className="animate-pulse" /> : <Check size={18} />}
                    </button>
                  </div>
                </div>
              </section>

              {/* System Maintenance Section */}
              <section className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <AlertCircle size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">System Maintenance</span>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white font-black text-sm flex items-center justify-center space-x-2 hover:bg-white/10 transition-all"
                  >
                    <Download size={18} />
                    <span>Archive Data Package</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      disabled={isLoggingOut}
                      className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 text-red-400 font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      <span>Sign Out</span>
                    </button>

                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeletingAccount}
                      className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 text-red-500 font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-all disabled:opacity-50"
                    >
                      {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      <span>Terminate</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-2">
                  <WalletIcon size={14} className="text-orange-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Financial Protocols</span>
                </div>
                
                <div className="space-y-4">
                  <CreateWallet />
                  <Transfer />
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Confirmation Dialogs */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">Confirm Logout</h3>
              <p className="text-slate-400 text-sm mb-8">
                Are you sure you want to log out?
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleLogoutConfirmed} disabled={isLoggingOut} className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400 font-black text-sm hover:bg-red-500/30 transition-all disabled:opacity-50">
                  {isLoggingOut ? <Loader2 size={18} className="animate-spin mr-2" /> : 'Log Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">Delete Account?</h3>
              <p className="text-slate-400 text-sm mb-8">
                This action is irreversible. All your data will be permanently deleted.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleDeleteAccountConfirmed} disabled={isDeletingAccount} className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400 font-black text-sm hover:bg-red-500/30 transition-all disabled:opacity-50">
                  {isDeletingAccount ? <Loader2 size={18} className="animate-spin mr-2" /> : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;