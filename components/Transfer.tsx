import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useTransfer, useGetWallet, useBalance, ChainToken } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Send, Loader2, Wallet } from 'lucide-react';

export default function Transfer() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [encryptKey, setEncryptKey] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  
  const { fetchWallet } = useGetWallet();
  const { fetchBalance, isLoading: isFetchingBalance } = useBalance();
  const { transferAsync, isLoading: isLoadingTransfer } = useTransfer();
 
  const loadBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      if (!token) return;

      const wallet = await fetchWallet({
        getBearerToken: () => Promise.resolve(token)
      });

      if (wallet) {
        const balanceResponse = await fetchBalance({
          getBearerToken: () => Promise.resolve(token),
          params: {
            address: wallet.publicKey,
            token: "USDC" as ChainToken
          }
        });
        setBalance(balanceResponse || 0);
      }
    } catch (e) {
      console.error("Error loading balance for transfer:", e);
    }
  }, [user?.id, getToken, fetchWallet, fetchBalance]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleTransfer = async () => {
    if (!amount || !recipientAddress || !encryptKey) {
      showError("Please fill in all fields");
      return;
    }

    if (balance !== null && Number(amount) > balance) {
      showError("Insufficient balance");
      return;
    }

    const toastId = showLoading("Processing transfer...");
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed");

      const wallet = await fetchWallet({
        getBearerToken: () => Promise.resolve(token),
      });

      if (!wallet) {
        showError("Wallet not found");
        dismissToast(toastId);
        return;
      }
  
      await transferAsync({
        bearerToken: token,
        params: {
          encryptKey,
          wallet: {
            publicKey: wallet.publicKey,
            encryptedPrivateKey: wallet.encryptedPrivateKey,
          },
          amount: Number(amount),
          token: "USDC" as ChainToken,
          recipient: recipientAddress,
        },
      });

      showSuccess("Transfer completed successfully!");
      setAmount("");
      setRecipientAddress("");
      setEncryptKey("");
      loadBalance(); // Refresh balance
      
    } catch (error: any) {
      showError(error.message || "Transfer failed");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Send size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Chipi Transfer</span>
        </div>
        <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-2">
          <Wallet size={12} className="text-slate-500" />
          <span className="text-[10px] font-bold text-white">
            {isFetchingBalance ? '...' : `${balance || 0} USDC`}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recipient</label>
          <input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500 placeholder:text-slate-600 font-medium"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500 placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Secure Key</label>
            <input
              type="password"
              placeholder="••••"
              value={encryptKey}
              onChange={(e) => setEncryptKey(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500 placeholder:text-slate-600 font-medium"
            />
          </div>
        </div>
        
        <button
          onClick={handleTransfer}
          disabled={isLoadingTransfer || !amount || !recipientAddress || !encryptKey}
          className="w-full bg-cyan-500 text-black px-4 py-5 rounded-2xl disabled:opacity-50 font-black text-sm flex items-center justify-center space-x-2 hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/10 mt-2"
        >
          {isLoadingTransfer ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          <span>{isLoadingTransfer ? "Processing Transfer..." : "Execute Transfer"}</span>
        </button>
      </div>
    </div>
  );
}