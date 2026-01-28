import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useCreateWallet, useGetWallet, useGetBalance, ChainToken } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Loader2, Wallet, Copy, RefreshCw, CheckCircle2, Plus } from 'lucide-react';

export default function CreateWallet() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [encryptKey, setEncryptKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);

  const { 
    data: walletData, 
    isLoading: isFetchingWallet, 
    refetch: refetchWallet 
  } = useGetWallet({
    params: {
      externalUserId: user?.id || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(user?.id),
    },
  });

  const { 
    data: balanceData, 
    isLoading: isFetchingBalance,
    refetch: refetchBalance
  } = useGetBalance(
    walletData ? {
      address: walletData.publicKey,
      token: "USDC" as ChainToken
    } : null,
    {
      getBearerToken: async () => {
        const token = await getToken();
        if (!token) throw new Error("No token found");
        return token;
      }
    }
  );

  const { createWalletAsync, isLoading: isCreating } = useCreateWallet();

  const handleCreateWallet = async () => {
    if (!encryptKey) {
      showError("Please enter an encryption key");
      return;
    }

    const toastId = showLoading("Initializing new wallet protocol...");
    try {
      const token = await getToken();
      if (!token || !user?.id) throw new Error("Authentication failed");

      await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: user.id,
        },
        bearerToken: token,
      });
      
      showSuccess("New wallet created successfully!");
      setEncryptKey("");
      setShowCreateNew(false);
      refetchWallet();
    } catch (error: any) {
      showError(error.message || "Failed to create wallet");
    } finally {
      dismissToast(toastId);
    }
  };

  const copyToClipboard = () => {
    if (walletData?.publicKey) {
      navigator.clipboard.writeText(walletData.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess("Address copied to clipboard");
    }
  };

  const handleRefresh = () => {
    refetchWallet();
    refetchBalance();
  };

  if (isFetchingWallet) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white/5 rounded-[2.5rem] border border-white/10">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Scanning Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Wallet size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Chipi Protocol</span>
        </div>
        <div className="flex items-center space-x-2">
          {walletData && !showCreateNew && (
            <button 
              onClick={() => setShowCreateNew(true)}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
              title="Create new wallet"
            >
              <Plus size={16} />
            </button>
          )}
          {walletData && (
            <button 
              onClick={handleRefresh}
              disabled={isFetchingBalance}
              className={`text-slate-500 hover:text-cyan-400 transition-colors p-1 ${isFetchingBalance ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {walletData && !showCreateNew ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Available Balance</p>
              <h3 className="text-3xl font-black text-white tracking-tight">
                {balanceData !== undefined ? balanceData.toLocaleString() : '---'} <span className="text-cyan-400 text-lg">USDC</span>
              </h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Address</p>
              <div 
                onClick={copyToClipboard}
                className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <code className="text-[10px] text-slate-400 font-mono truncate mr-2">
                  {walletData.publicKey}
                </code>
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-600 group-hover:text-cyan-400" />}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <h2 className="text-xl font-black text-white mb-2">
            {walletData ? "Deploy New Node" : "Deploy Wallet"}
          </h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
            Initialize a financial node to enable USDC transfers. {walletData && "This will replace the current active link."}
          </p>
          
          <input
            type="password"
            placeholder="Set encryption key (Required)"
            value={encryptKey}
            onChange={(e) => setEncryptKey(e.target.value)}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500 placeholder:text-slate-600 font-medium"
          />
          
          <div className="flex space-x-3">
            <button
              onClick={handleCreateWallet}
              disabled={isCreating || !encryptKey}
              className="flex-1 bg-cyan-500 text-black rounded-2xl py-4 font-black text-sm flex items-center justify-center space-x-2 hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
              <span>{isCreating ? "Deploying..." : "Initialize"}</span>
            </button>
            {walletData && (
              <button
                onClick={() => setShowCreateNew(false)}
                className="px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}