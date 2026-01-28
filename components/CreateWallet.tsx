import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useCreateWallet } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Loader2, Wallet } from 'lucide-react';

export default function CreateWallet() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [encryptKey, setEncryptKey] = useState("");

  const handleCreateWallet = async () => {
    if (!encryptKey) {
      showError("Please enter an encryption key");
      return;
    }

    if (!user?.id) {
      showError("User not authenticated with Clerk.");
      return;
    }

    const toastId = showLoading("Creating wallet...");
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("No bearer token found from Clerk.");
      }

      const response = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: user.id,
        },
        bearerToken: token,
      });
      
      console.log('createWalletResponse', response);
      showSuccess("Wallet created successfully!");
      setEncryptKey("");
    } catch (error: any) {
      showError(error.message || "Failed to create wallet");
      console.error("Error creating wallet:", error);
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl">
      <div className="flex items-center space-x-2 text-primary-500 mb-4">
        <Wallet size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Chipi Wallet</span>
      </div>
      <h2 className="text-xl font-black text-white mb-4">Create Your Wallet</h2>
      
      <div className="space-y-4">
        <input
          type="password"
          placeholder="Enter encryption key"
          value={encryptKey}
          onChange={(e) => setEditingName(e.target.value)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500 placeholder:text-slate-600 font-medium"
        />
        
        <button
          onClick={handleCreateWallet}
          disabled={isLoading || !encryptKey}
          className="w-full bg-primary-500 text-black rounded-2xl py-4 font-black text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
          <span>{isLoading ? "Creating..." : "Create Wallet"}</span>
        </button>
      </div>
    </div>
  );
}