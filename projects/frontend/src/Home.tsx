// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import SendAlgo from './components/SendAlgo'
import MintNFT from './components/MintNFT'
import CreateASA from './components/CreateASA'
import AssetOptIn from './components/AssetOptIn'
import Bank from './components/Bank'
import DevDuel from './components/DevDuel'
import Taskbar from './components/Taskbar';
import LandingPage from './components/LandingPage'


interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
 

  return (
    <div>
      <Taskbar />
      <LandingPage />
     
    </div>
  )
}

export default Home
