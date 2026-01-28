import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useCreateWallet } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Loader2, Wallet } from 'lucide-react';
import { getTranslation } from '../src/lib/translations';

interface Props {
  language?: string;
}

export default function CreateWallet({ language = 'en' }: Props) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [encryptKey, setEncryptKey] = useState("");
  const t = (key: any) => getTranslation(language, key);

  const handleCreateWallet = async () => {
    if (!encryptKey) {
      showError(t('financeEncryptionKey'));
      return;
    }

    if (!user?.id) {
      showError("User not authenticated.");
      return;
    }

    const toastId = showLoading(t('financeCreating'));
    try {
      const token = await getToken();
      if (!token) throw new Error("No bearer token found.");

      await createWalletAsync({
        params: { encryptKey, externalUserId: user.id },
        bearerToken: token,
      });
      
      showSuccess("Wallet created successfully!");
      setEncryptKey("");
    } catch (error: any) {
      showError(error.message || "Failed to create wallet");
    } finally { dismissToast(toastId); }
  };

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl">
      <div className="flex items-center space-x-2 text-primary-500 mb-4">
        <Wallet size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">{t('financeTitle')}</span>
      </div>
      <h2 className="text-xl font-black text-white mb-4">{t('financeCreateWallet')}</h2>
      
      <div className="space-y-4">
        <input
          type="password"
          placeholder={t('financeEncryptionKey')}
          value={encryptKey}
          onChange={(e) => setEncryptKey(e.target.value)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500 placeholder:text-slate-600 font-medium"
        />
        
        <button
          onClick={handleCreateWallet}
          disabled={isLoading || !encryptKey}
          className="w-full bg-primary-500 text-black rounded-2xl py-4 font-black text-sm flex items-center justify-center space-x-2 hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
          <span>{isLoading ? t('financeCreating') : t('financeCreateWallet')}</span>
        </button>
      </div>
    </div>
  );
}