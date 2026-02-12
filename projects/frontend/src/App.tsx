import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import Home from './Home' 

// --- 1. ROBUST CONFIGURATION ---
// If the .env file is missing, we default to 'localnet' to prevent the "No Wallets" error.
const currentNetwork = import.meta.env.VITE_ALGOD_NETWORK || 'localnet';

let supportedWallets: SupportedWallet[];

if (currentNetwork === 'localnet') {
  // 🟡 DEV MODE: Try to load KMD (Local Wallet)
  // If config is missing, we use standard AlgoKit Sandbox defaults.
  let kmdConfig;
  try {
    kmdConfig = getKmdConfigFromViteEnvironment();
  } catch (e) {
    console.warn("Using default KMD config (AlgoKit Sandbox Defaults)");
    kmdConfig = {
      server: "http://localhost",
      port: "4002",
      token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // Standard Sandbox Token
      wallet: "unencrypted-default-wallet",
      password: ""
    };
  }
  
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
    { 
      id: WalletId.PERA, 
      options: { compactMode: true } 
    },
    { id: WalletId.DEFLY }
  ]
} else {
  // 🟢 PROD MODE: Mainnet/Testnet Wallets
  supportedWallets = [
    { id: WalletId.PERA },
    { id: WalletId.DEFLY },
    { id: WalletId.EXODUS },
  ]
}

export default function App() {
  // Retrieve Algod Config with a safety fallback
  let algodConfig;
  try {
    algodConfig = getAlgodConfigFromViteEnvironment();
  } catch (e) {
    algodConfig = { network: 'localnet', server: 'http://localhost', port: '4001', token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  }

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
    // 🛑 STOP AUTO-RECONNECT (Fixes the "Ghost Login")
    options: { 
      resetNetwork: true,
      reconnectProviders: false 
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <Home />
      </WalletProvider>
    </SnackbarProvider>
  )
}