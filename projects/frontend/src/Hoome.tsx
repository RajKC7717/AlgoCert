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
    <div className="min-h-screen bg-yellow-50 text-black font-mono relative overflow-x-hidden selection:bg-black selection:text-white">
      
      {/* BACKGROUND PATTERN (DOTS) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

      {/* Top-right wallet connect button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          className={`
            px-6 py-3 font-bold text-sm border-2 border-black transition-all
            shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:shadow-none
            ${activeAddress ? 'bg-green-400 text-black' : 'bg-white text-black'}
          `}
          onClick={toggleWalletModal}
        >
          {activeAddress ? 'WALLET CONNECTED' : 'CONNECT WALLET'}
        </button>
      </div>

      {/* Centered content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-12 relative z-0">
        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[16px_16px_0px_0px_#000] max-w-5xl w-full relative">
          
          {/* DECORATIVE BADGE */}
          <div className="absolute -top-6 -left-6 bg-yellow-400 border-4 border-black px-4 py-2 font-black text-xl rotate-[-5deg] shadow-[4px_4px_0px_0px_#000]">
            BETA v1.0
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-2 text-center tracking-tighter uppercase">
            Smart-Lab <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 decoration-black decoration-4 underline">Academy</span>
          </h1>
          
          <p className="text-gray-600 mb-12 text-center font-bold text-lg uppercase tracking-widest border-b-4 border-black pb-4 mx-auto max-w-2xl">
            Decentralized Examination & Certification Protocol
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* DEV DUEL CARD (The Exam) */}
            <div className="col-span-1 md:col-span-3 bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#888] hover:shadow-[12px_12px_0px_0px_#000] transition-all transform hover:-translate-y-1 relative group">
              
              {/* Card Label */}
              <div className="absolute top-0 right-0 bg-red-500 text-white font-bold px-3 py-1 border-l-4 border-b-4 border-black text-xs">
                LIVE EXAM
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black mb-2 text-yellow-400 italic">
                        PYTHON FINALS
                    </h2>
                    <p className="text-gray-300 font-mono text-sm max-w-xl leading-relaxed">
                        Prove your coding skills in a monitored environment. Keystroke forensics active. 
                        Pass the test to mint your <span className="font-bold text-white underline decoration-yellow-400">Proof-of-Skill NFT</span> on Algorand.
                    </p>
                </div>

                <button 
                  className={`
                    px-8 py-4 font-black text-lg uppercase border-4 border-white transition-all w-full md:w-auto
                    ${activeAddress 
                        ? 'bg-yellow-400 text-black hover:bg-white hover:border-yellow-400' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-600'}
                  `}
                  disabled={!activeAddress}
                  onClick={() => setDevDuelModal(true)}
                >
                  {activeAddress ? "ENTER EXAM HALL ->" : "CONNECT WALLET FIRST"}
                </button>
              </div>
            </div>

            {/* Placeholder 1 */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#ccc] opacity-60">
               <h2 className="text-xl font-bold mb-2 uppercase border-b-2 border-black inline-block">Rust Basics</h2>
               <p className="text-sm mt-2 font-mono">Module Locked.</p>
            </div>

            {/* Placeholder 2 */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#ccc] opacity-60">
               <h2 className="text-xl font-bold mb-2 uppercase border-b-2 border-black inline-block">Solidity 101</h2>
               <p className="text-sm mt-2 font-mono">Coming Soon.</p>
            </div>

            {/* Placeholder 3 */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#ccc] opacity-60">
               <h2 className="text-xl font-bold mb-2 uppercase border-b-2 border-black inline-block">Algorand TEAL</h2>
               <p className="text-sm mt-2 font-mono">Under Construction.</p>
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