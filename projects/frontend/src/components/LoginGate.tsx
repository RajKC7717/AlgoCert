import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';

interface LoginGateProps {
  onLoginSuccess: () => void;
}

const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const { providers, activeAddress } = useWallet();
  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "DENIED">("IDLE");

  // --- 1. ENTER LOGIC (Universal Access) ---
  const handleEnter = () => {
    if (!activeAddress) {
        alert("❌ Wallet not connected! Please select a provider.");
        return;
    }

    setStatus("CHECKING");
    
    // Simulate verification delay (feels professional)
    setTimeout(() => {
        // ✅ UNIVERSAL ACCESS: Allow any valid Algorand address
        // If you need a whitelist later, verify against a backend API here.
        if (activeAddress.length === 58) {
           onLoginSuccess();
        } else {
           setStatus("DENIED");
        }
    }, 1000);
  };

  // --- 2. DISCONNECT LOGIC ---
  const handleDisconnect = () => {
    // Disconnect every provider found
    if (providers) {
      providers.forEach((p) => { try { p.disconnect(); } catch (e) { console.error(e); } });
    }
    // Nuclear option: Clear storage to fix "Ghost Login"
    localStorage.clear(); 
    sessionStorage.clear();
    window.location.reload();
  };

  // --- UI RENDERER ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>

      <div className="z-10 max-w-md w-full p-8 bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">SMART-LAB</h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest">Select Wallet to Login</p>
        </div>

        {/* 1. WALLET SELECTION (Only shows if NOT connected) */}
        {!activeAddress && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {providers?.map((provider) => (
              <button
                key={provider.metadata.id}
                onClick={provider.connect}
                className="w-full flex items-center justify-between p-4 bg-[#252526] hover:bg-[#2a2a2b] border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <img src={provider.metadata.icon} alt={provider.metadata.name} className="w-8 h-8 rounded-lg" />
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">{provider.metadata.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{provider.metadata.id === 'kmd' ? 'Local Dev' : 'Mobile App'}</div>
                  </div>
                </div>
                <div className="text-gray-600 group-hover:text-blue-500">→</div>
              </button>
            ))}
             {(!providers || providers.length === 0) && (
               <div className="text-red-500 text-xs text-center">No wallets found. Check App.tsx configuration.</div>
            )}
          </div>
        )}

        {/* 2. CONNECTED STATE */}
        {activeAddress && status === "IDLE" && (
          <div className="text-center animate-in zoom-in duration-300">
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                <div className="text-green-400 text-3xl">✓</div>
             </div>
             <h3 className="text-white font-bold text-xl mb-1">Wallet Connected</h3>
             <p className="text-gray-500 font-mono text-xs mb-6 bg-black/40 py-2 rounded border border-gray-800 break-all px-2">
                {activeAddress.slice(0, 10)}...{activeAddress.slice(-10)}
             </p>
             
             <button onClick={handleEnter} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/40 transition-all transform hover:scale-[1.02]">
               ENTER EXAM PORTAL
             </button>
             
             <button onClick={handleDisconnect} className="mt-4 text-xs text-gray-500 hover:text-red-400 underline transition-colors">
                Disconnect & Switch Wallet
             </button>
          </div>
        )}

        {/* 3. LOADING STATE */}
        {status === "CHECKING" && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400 font-mono text-xs animate-pulse">Verifying Identity...</p>
          </div>
        )}

        {/* 4. DENIED STATE */}
        {status === "DENIED" && (
          <div className="text-center py-4 bg-red-900/10 border border-red-500/30 rounded-xl animate-in shake duration-300">
            <div className="text-4xl mb-2">⛔</div>
            <h3 className="text-red-500 font-bold">ACCESS DENIED</h3>
            <p className="text-gray-400 text-xs mt-1 mb-4">Wallet address is invalid.</p>
            <button onClick={() => setStatus("IDLE")} className="px-6 py-2 bg-gray-800 rounded text-xs font-bold">Try Again</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginGate;