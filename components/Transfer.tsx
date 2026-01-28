import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useTransfer, useGetWallet, ChainToken } from "@chipi-stack/chipi-react";
import { showSuccess, showError, showLoading, dismissToast } from '../src/utils/toast';
import { Send, Loader2 } from 'lucide-react';

export default function Transfer() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [encryptKey, setEncryptKey] = useState("");
  const { fetchWallet } = useGetWallet();
  const { transferAsync, isLoading: isLoadingTransfer } = useTransfer();
 
  const handleTransfer = async () => {
    if (!amount || !recipientAddress || !encryptKey) {
      showError("Please fill in all fields");
      return;
    }

    if (!user?.id) {
      showError("User not authenticated with Clerk.");
      return;
    }

    const toastId = showLoading("Processing transfer...");
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error("No bearer token found from Clerk.");
      }

      const wallet = await fetchWallet({
        getBearerToken: () => Promise.resolve(token),
      });

      if (!wallet) {
        showError("Failed to retrieve wallet. Please ensure it's created.");
        dismissToast(toastId);
        return;
      }
  
      const transferResponse = await transferAsync({
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
    } catch (error: any) {
      showError(error.message || "Transfer failed");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl">
      <div className="flex items-center space-x-2 text-primary-500 mb-4">
        <Send size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Chipi Transfer</span>
      </div>
      <h2 className="text-xl font-black text-white mb-4">Transfer USDC</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500 placeholder:text-slate-600 font-medium"
        />
        
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500 placeholder:text-slate-600 font-medium"
        />
        
        <input
          type="password"
          placeholder="Encryption Key"
          value={encryptKey}
          onChange={(e) => setEncryptKey(e.target.value)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500 placeholder:text-slate-600 font-medium"
        />
        
        <button
          onClick={handleTransfer}
          disabled={isLoadingTransfer || !amount || !recipientAddress || !encryptKey}
          className="w-full bg-primary-500 text-black px-4 py-4 rounded-2xl disabled:opacity-50 font-black text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-all active:scale-95"
        >
          {isLoadingTransfer ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          <span>{isLoadingTransfer ? "Processing..." : "Make Transfer"}</span>
        </button>
      </div>
    </div>
  );
}