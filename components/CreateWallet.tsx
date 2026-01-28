import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useCreateWallet, useGetWallet, useBalance, ChainToken } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Loader2, Wallet, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CreateWallet() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading: isCreating } = useCreateWallet();
  const { fetchWallet, isLoading: isFetchingWallet } = useGetWallet();
  const { fetchBalance, isLoading: isFetchingBalance } = useBalance();
  
  const [walletData, setWalletData] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [encryptKey, setEncryptKey] = useState("");
  const [copied, setCopied] = useState(false);

  const loadWalletInfo = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const wallet = await fetchWallet({
        getBearerToken: () => Promise.resolve(token)
      });

      if (wallet) {
        setWalletData(wallet);
        const balanceResponse = await fetchBalance({
          getBearerToken: () => Promise.resolve(token),
          params: {
            address: wallet.publicKey,
            token: "USDC" as ChainToken
          }
        });
        setBalance(balanceResponse || 0);
      }
    } catch (error) {
      console.error("Error loading wallet info:", error);
    }
  }, [user?.id, getToken, fetchWallet, fetchBalance]);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  const handleCreateWallet = async () => {
    if (!encryptKey) {
      showError("Please enter an encryption key");
      return;
    }

    const toastId = showLoading("Initializing wallet protocol...");
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
      
      showSuccess("Wallet created successfully!");
      setEncryptKey("");
      await loadWalletInfo(); 
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
        {walletData && (
          <button 
            onClick={loadWalletInfo}
            disabled={isFetchingBalance}
            className={`text-slate-500 hover:text-cyan-400 transition-colors ${isFetchingBalance ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {walletData ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Available Balance</p>
              <h3 className="text-3xl font-black text-white tracking-tight">
                {balance !== null ? balance.toLocaleString() : '---'} <span className="text-cyan-400 text-lg">USDC</span>
              </h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Wallet Address</p>
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
          
          <div className="flex items-center space-x-2 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
            <CheckCircle2 size={16} className="text-cyan-400" />
            <p className="text-[10px] font-bold text-cyan-400 uppercase">Wallet Synchronized</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <h2 className="text-xl font-black text-white mb-2">Deploy New Wallet</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
            Initialize your financial node to enable USDC transfers within the growth space.
          </p>
          
          <input
            type="password"
            placeholder="Set encryption key (Required)"
            value={encryptKey}
            onChange={(e) => setEncryptKey(e.target.value)}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500 placeholder:text-slate-600 font-medium"
          />
          
          <button
            onClick={handleCreateWallet}
            disabled={isCreating || !encryptKey}
            className="w-full bg-cyan-500 text-black rounded-2xl py-4 font-black text-sm flex items-center justify-center space-x-2 hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
            <span>{isCreating ? "Deploying..." : "Initialize Wallet"}</span>
          </button>
        </div>
      )}
    </div>
  );
}