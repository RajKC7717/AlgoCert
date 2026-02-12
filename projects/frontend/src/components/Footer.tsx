import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-white text-black border-t-[4px] border-black font-sans relative z-10">
      
      {/* MAIN GRID CONTAINER */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4">

        {/* --- COL 1: BRANDING (The Hero Panel) --- */}
        <div className="p-8 md:border-r-[3px] border-black flex flex-col justify-between h-full min-h-[250px] relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none font-black">
                ⚡
            </div>
            
            <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4">
                    ALGO<br/><span className="text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Cert</span>
                </h2>
                <p className="font-mono text-xs font-bold leading-relaxed max-w-[200px]">
                    The world's first Anti-Cheat Exam Protocol secured by the Algorand Blockchain.
                </p>
            </div>
            
            <div className="mt-8">
                <span className="inline-block px-2 py-1 bg-black text-white text-xs font-bold uppercase tracking-widest transform -rotate-2">
                    EST. 2026
                </span>
            </div>
        </div>

        {/* --- COL 2: PLATFORM (Navigation) --- */}
        <div className="p-8 md:border-r-[3px] border-black flex flex-col border-t-[3px] md:border-t-0">
            <h3 className="text-xl font-black uppercase mb-6 decoration-4 underline decoration-yellow-400 underline-offset-4">
                Platform
            </h3>
            <ul className="space-y-3 font-bold text-sm">
                <li><Link to="/dashboard" className="hover:bg-yellow-300 px-1 transition-colors">Dashboard Core</Link></li>
                <li><Link to="/exams" className="hover:bg-yellow-300 px-1 transition-colors">Exam Arena</Link></li>
                <li><Link to="/marketplace" className="hover:bg-yellow-300 px-1 transition-colors">Tutor Market</Link></li>
                <li><Link to="/leaderboard" className="hover:bg-yellow-300 px-1 transition-colors">Global Ranks</Link></li>
            </ul>
        </div>

        {/* --- COL 3: RESOURCES (Docs) --- */}
        <div className="p-8 md:border-r-[3px] border-black flex flex-col border-t-[3px] md:border-t-0">
            <h3 className="text-xl font-black uppercase mb-6 decoration-4 underline decoration-blue-400 underline-offset-4">
                Resources
            </h3>
            <ul className="space-y-3 font-bold text-sm">
                <li><a href="#" className="hover:bg-blue-200 px-1 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:bg-blue-200 px-1 transition-colors">Whitepaper v1.0</a></li>
                <li><a href="#" className="hover:bg-blue-200 px-1 transition-colors">GitHub Repo</a></li>
                <li><a href="#" className="hover:bg-blue-200 px-1 transition-colors">Smart Contracts</a></li>
            </ul>
        </div>

        {/* --- COL 4: STATUS (System) --- */}
        <div className="p-8 flex flex-col border-t-[3px] md:border-t-0 bg-zinc-50">
            <h3 className="text-xl font-black uppercase mb-6">
                System Status
            </h3>
            
            {/* Status Indicator Box */}
            <div className="border-[2px] border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 border border-black animate-pulse"></span>
                    <span className="font-mono text-xs font-bold">MAINNET: ONLINE</span>
                </div>
                <div className="w-full bg-gray-200 h-1 mt-2">
                    <div className="bg-black h-1 w-[98%]"></div>
                </div>
                <div className="text-[10px] font-mono mt-1 text-right">UPTIME: 99.9%</div>
            </div>

            <div className="mt-auto text-xs font-bold text-zinc-500">
                &copy; 2026 AlgoCert Labs.<br/>
                Built on <span className="text-black">Algorand</span>.
            </div>
        </div>

      </div>

      {/* BOTTOM STRIP */}
      <div className="w-full border-t-[3px] border-black bg-yellow-400 py-2 text-center overflow-hidden">
         <p className="text-[10px] font-black tracking-[0.5em] uppercase animate-marquee whitespace-nowrap">
            /// VERIFY INTEGRITY /// TRUST CODE /// NO BOTS ALLOWED /// AlgoCert ARENA ///
         </p>
      </div>

    </footer>
  );
};

export default Footer;