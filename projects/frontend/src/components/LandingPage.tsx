import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Taskbar from './Taskbar';
// IMPORT YOUR VIDEO HERE
import bgVideo from '../assets/bgvid.mp4'; 
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  // --- TOOLTIP STATE ---
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const features = {
    devDuel: "Real-time keystroke dynamics analysis to distinguish humans from AI bots.",
    stats: "Live accuracy metrics updated on-chain every 4 seconds.",
    tutors: "P2P Marketplace using Smart Contracts for instant settlements.",
    vault: "Automated team payment splitting using Inner Transactions.",
    certs: "Soulbound ARC-3 NFTs: Immutable proof of skill."
  };

  const handleEnter = () => {
    navigate('/dashboard'); 
  };

  return (
    // MASTER CONTAINER: Handles Scroll Snap
    <div className="w-full h-screen overflow-y-scroll snap-y snap-mandatory bg-white font-sans scroll-smooth custom-scrollbar">
      
      {/* =========================================
          SECTION 1: VIDEO INTRO (100vh)
          Snap-start locks this section.
      ========================================= */}
      <section className="relative w-full h-screen snap-start shrink-0 overflow-hidden border-b-[4px] border-black">
        
        {/* VIDEO LAYER */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" /> 
          <video autoPlay loop muted playsInline className="w-full h-full object-cover grayscale contrast-125">
            <source src={bgVideo} type="video/mp4" />
          </video>
          {/* Halftone Overlay for Comic Feel */}
          <div className="absolute inset-0 z-10 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        {/* COMIC BUTTON */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end h-full pb-40">
          
          <button
            onClick={handleEnter}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className={`
              relative px-10 py-4 text-2xl font-black italic tracking-wider uppercase
              bg-white text-black border-[4px] border-black transition-all duration-150 ease-out
              shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
              hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[6px] hover:translate-y-[6px] hover:bg-yellow-300
              active:translate-x-[8px] active:translate-y-[8px] active:shadow-none
            `}
          >
            {isButtonHovered && <span className="absolute -top-6 -right-6 text-5xl animate-bounce drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">💥</span>}
            ENTER
          </button>
        </div>
      </section>

      {/* =========================================
          SECTION 2: COMIC BENTO GRID (100vh)
          Snap-start locks this section.
      ========================================= */}
      <section 
        className="relative w-full h-screen snap-start shrink-0 bg-white flex items-center justify-center p-4 md:p-10 overflow-hidden border-b-[4px] border-black"
        onMouseMove={handleMouseMove}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* --- CUSTOM COMIC TOOLTIP --- */}
        {activeTooltip && (
          <div 
            className="fixed z-50 w-64 p-4 bg-black text-white border-[3px] border-white font-mono text-xs font-bold uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] pointer-events-none transition-opacity duration-150"
            style={{
              left: cursorPos.x + (cursorPos.x > window.innerWidth / 2 ? -280 : 20), 
              top: cursorPos.y + (cursorPos.y > window.innerHeight / 2 ? -100 : 20)
            }}
          >
             <span className="text-yellow-400 mr-2">///</span>
            {activeTooltip}
          </div>
        )}

        {/* --- THE GRID CONTAINER --- */}
        <div className="relative w-full max-w-7xl h-full max-h-[900px] grid grid-cols-1 md:grid-cols-4 grid-rows-4 md:grid-rows-3 gap-4">
            
            {/* THE "GAP BUTTON" (CENTER HUB) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-3/2 -translate-y-1/2 z-40 hidden md:block">
               <button 
                 onClick={handleEnter}
                 className="w-36 h-28 bg-white border-[4px] border-black text-black font-black text-xs 
                 hover:scale-110 hover:bg-black hover:text-white hover:border-white transition-all duration-200 
                 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(255,235,59,1)]
                 flex items-center justify-center text-center leading-tight tracking-tighter uppercase italic"
               >
                 GO TO<br/>DASHBOARD
               </button>
            </div>


            {/* --- BENTO ITEM 1: DEV DUEL --- */}
            <div 
                className="md:col-span-2 md:row-span-2 group relative border-[4px] border-black bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                onMouseEnter={() => setActiveTooltip(features.devDuel)}
                onMouseLeave={() => setActiveTooltip(null)}
            >
                <div className="absolute inset-0 bg-zinc-100 group-hover:bg-yellow-300 transition-colors duration-200"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <h2 className="text-5xl font-black text-black mb-2 italic uppercase tracking-tighter group-hover:translate-x-2 transition-transform">Exam-Hall</h2>
                    <p className="text-black font-bold font-mono border-t-2 border-black pt-2 inline-block w-max">/// ANTI-CHEAT ENGINE</p>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <span className="text-6xl font-black">⌨️</span>
                </div>
            </div>

            {/* --- BENTO ITEM 2: STATS --- */}
            <div 
                className="group relative border-[4px] border-black bg-white flex items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-300"
                onMouseEnter={() => setActiveTooltip(features.stats)}
                onMouseLeave={() => setActiveTooltip(null)}
            >
                <span className="text-black font-black text-7xl italic drop-shadow-[2px_2px_0_rgba(255,255,255,1)]">98%</span>
                <span className="absolute bottom-2 text-xs font-bold border px-1 border-black bg-white">ACCURACY</span>
            </div>

            {/* --- BENTO ITEM 3: MARKETPLACE --- */}
            <div 
                className="md:row-span-2 group relative border-[4px] border-black bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-300"
                onMouseEnter={() => setActiveTooltip(features.tutors)}
                onMouseLeave={() => setActiveTooltip(null)}
            >
                 <div className="absolute inset-0 flex flex-col justify-between p-6">
                    <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 className="text-3xl font-black text-black italic uppercase -rotate-2">Tutors</h3>
                 </div>
            </div>

            {/* --- BENTO ITEM 4: TEAM VAULT --- */}
            <div 
                className="md:col-span-2 group relative border-[4px] border-black bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400"
                onMouseEnter={() => setActiveTooltip(features.vault)}
                onMouseLeave={() => setActiveTooltip(null)}
            >
                <div className="absolute inset-0 flex items-center justify-between px-8">
                    <h3 className="text-4xl font-black text-black uppercase italic tracking-tighter">TeamVault</h3>
                    <div className="font-mono bg-black text-white px-2 py-1 text-xl font-bold -rotate-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                        {`{split: 'auto'}`}
                    </div>
                </div>
            </div>

            {/* --- BENTO ITEM 5: CERTIFICATES --- */}
            <div 
                className="md:col-span-2 group relative border-[4px] border-black bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-green-300"
                onMouseEnter={() => setActiveTooltip(features.certs)}
                onMouseLeave={() => setActiveTooltip(null)}
            >
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <h3 className="text-4xl font-black text-black uppercase tracking-widest italic group-hover:scale-110 transition-transform">ARC-3 NFT</h3>
                    <span className="bg-black text-white text-xs px-2 py-1 mt-2 font-mono">VERIFIED CREDENTIALS</span>
                 </div>
            </div>

        </div>

        

      </section>

      {/* =========================================
          SECTION 3: FOOTER (Auto Height)
          Snap-start so you can scroll down to it.
      ========================================= */}
      <section className="w-full snap-start shrink-0 bg-white">
          <Footer />
      </section>

      {/* 3. THE TASKBAR */}
      <Taskbar />

    </div>
  );
};

export default LandingPage;