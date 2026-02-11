import { useState } from 'react'
import { SupportedWallet, WalletId, WalletManager, WalletProvider, useWallet } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import ConnectWallet from './components/ConnectWallet'
import ExamRoom from './components/ExamRoom'

// --- WALLET SETUP (Standard) ---
let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: { resetNetwork: true },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <SmartLabFlow /> 
      </WalletProvider>
    </SnackbarProvider>
  )
}

// --- THE NEW 3-STAGE FLOW ---
function SmartLabFlow() {
  const { activeAddress } = useWallet()
  const [examStarted, setExamStarted] = useState(false)

  // 1. LOGIN STATE (No Wallet Connected)
  if (!activeAddress) {
    return (
      <div className="hero min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
         <div className="text-center mb-12">
            <h1 className="text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                Smart-Lab
            </h1>
            <p className="text-2xl text-gray-400">The Blockchain-Verified Examination Platform</p>
         </div>
         
         <div className="p-10 bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl w-[400px]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center text-3xl">🔐</div>
                <p className="text-center text-gray-300">Connect your digital identity to access the secure exam environment.</p>
                <div className="w-full flex justify-center">
                    <ConnectWallet openModal={true} />
                </div>
            </div>
         </div>
      </div>
    )
  }

  // 2. EXAM ROOM (Action)
  if (examStarted) {
    return <ExamRoom />
  }

  // 3. LOBBY STATE (Wallet Connected, But Waiting to Start)
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full p-8 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white">Welcome, Student.</h2>
                    <p className="text-gray-400 mt-2 font-mono text-sm">ID: {activeAddress}</p>
                </div>
                <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-800">
                    ● Verified
                </div>
            </div>

            {/* Rules */}
            <div className="space-y-6 mb-8">
                <div className="bg-blue-900/20 p-4 rounded border-l-4 border-blue-500">
                    <h3 className="font-bold text-blue-400 mb-1">Exam: Python Algorithms 101</h3>
                    <p className="text-sm text-gray-300">Duration: Unlimited (Demo) • Fee: 0.001 Algo</p>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-300">⚠️ Anti-Cheat Protocols Active:</h3>
                    <ul className="text-gray-400 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="text-red-500">✖</span> No Tab Switching (Screen will lock)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-red-500">✖</span> No Copy-Pasting (Events are logged)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✔</span> AI-Verified Grading
                        </li>
                    </ul>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={() => setExamStarted(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg text-lg transition-all transform hover:scale-[1.02] shadow-lg"
            >
                ENTER EXAM ROOM 🚀
            </button>
        </div>
    </div>
  )
}