import React, { useState, useEffect } from 'react';
import { X, User, Download, Trash2, LogOut, AlertCircle, Check, Loader2, Wallet as WalletIcon } from 'lucide-react';
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

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onDownloadData,
  onDeleteAccount,
  onLogout,
}) => {
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
      <div className="bg-[#0a0a0c] w-full max-w-md border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <User size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">User Protocol</span>
          </div>
          <h2 className="text-2xl font-black text-white">Manage Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Edit Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Username</label>
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

          {/* Wallet Section */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center space-x-2 text-slate-500">
              <WalletIcon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Finance nodes</span>
            </div>
            <CreateWallet />
            <Transfer />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <button 
              onClick={handleDownload}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-white font-black text-sm flex items-center justify-center space-x-2 hover:bg-white/10 transition-all"
            >
              <Download size={18} />
              <span>Download My Data</span>
            </button>

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl py-4 text-red-400 font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 size={18} className="animate-spin mr-2" /> : <LogOut size={18} />}
              <span>Log Out</span>
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeletingAccount}
              className="w-full bg-red-500/20 border border-red-500/30 rounded-2xl py-4 text-red-500 font-black text-sm flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              {isDeletingAccount ? <Loader2 size={18} className="animate-spin mr-2" /> : <Trash2 size={18} />}
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Confirmation Dialogs */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-4">Confirm Logout</h3>
              <p className="text-slate-400 text-sm mb-8">
                Are you sure you want to log out? You will need to sign in again.
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