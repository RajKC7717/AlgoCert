import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom' // 1. Add Routes, Route
import Home from './Home'
import LandingPage from './components/LandingPage' // 2. Import your Landing Page
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import Preloader from './components/Preloader'

// ... (Your existing wallet config code remains exactly the same) ...
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
    { id: WalletId.LUTE },
  ]
}

export default function App() {
  const [loading, setLoading] = useState(true)
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
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <BrowserRouter>
          
          {/* LAYER 1: THE PRELOADER (Overlay) */}
          {/* This sits ON TOP because of z-index: 9999 in CSS.
             It renders conditionally. When onComplete fires, 'loading' becomes false 
             and this component is removed, revealing the app behind it.
          */}
          {loading && <Preloader onComplete={() => setLoading(false)} />}

          {/* LAYER 2: THE MAIN APP (Background) */}
          {/* This renders IMMEDIATELY. The video on LandingPage starts playing 
             hidden behind the black preloader curtains.
          */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Home />} />
          </Routes>

        </BrowserRouter>
      </WalletProvider>
    </SnackbarProvider>
  )
}