import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import DevDuel from './components/DevDuel'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [devDuelModal, setDevDuelModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-teal-400 via-cyan-300 to-sky-400 relative">
      {/* Top-right wallet connect button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          className="btn btn-accent px-5 py-2 text-sm font-medium rounded-full shadow-md"
          onClick={toggleWalletModal}
        >
          {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
      </div>

      {/* Centered content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="backdrop-blur-md bg-white/70 rounded-2xl p-8 shadow-xl max-w-5xl w-full">
          <h1 className="text-4xl font-extrabold text-teal-700 mb-6 text-center">Smart-Lab Academy</h1>
          <p className="text-gray-700 mb-8 text-center">Decentralized Examination & Certification</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* DEV DUEL CARD (The Exam) */}
            <div className="card bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl md:col-span-3">
              <div className="card-body">
                <h2 className="card-title text-2xl">⚔️ Python 101 Final Exam</h2>
                <p>Prove your coding skills with keystroke forensics and mint Proof-of-Skill NFTs.</p>
                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-warning" 
                    // Only allow entry if connected
                    disabled={!activeAddress}
                    onClick={() => setDevDuelModal(true)}
                  >
                    {activeAddress ? "Enter Exam Hall" : "Connect Wallet First"}
                  </button>
                </div>
              </div>
            </div>

            {/* Placeholder for other features */}
            <div className="card bg-base-100 shadow-xl opacity-50">
               <div className="card-body">
                 <h2 className="card-title">Coming Soon</h2>
                 <p>More features loading...</p>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      
      {/* Our Exam Logic Wrapped in a Modal */}
      <DevDuel openModal={devDuelModal} closeModal={() => setDevDuelModal(false)} />
    
    </div>
  )
}

export default Home