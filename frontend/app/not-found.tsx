"use client";

import Link from "next/link";
import { Home, Search, UtensilsCrossed } from "lucide-react";

export default function NotFound() {
  return (
    // Added suppressHydrationWarning to stop the React mismatch error
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 overflow-hidden relative" suppressHydrationWarning>
      
      {/* --- BACKGROUND ANIMATION (The "Spotlight") --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#f97316]/20 rounded-full blur-[100px] md:blur-[150px] animate-pulse z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700 delay-100 max-w-2xl">
        
        {/* --- HERO GRAPHIC (Floating Icon) --- */}
        <div className="mb-6 relative animate-[bounce_3s_ease-in-out_infinite]">
           <div className="bg-[#1a1a1a] p-6 rounded-full border-2 border-[#f97316]/20 shadow-[0_0_30px_-5px_#f9731650] relative z-10">
             <UtensilsCrossed size={80} className="text-[#f97316]" strokeWidth={1.5} />
           </div>
           
           <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/60 blur-md rounded-[50%] animate-[pulse_3s_ease-in-out_infinite_reverse]"></div>
        </div>

        {/* --- TYPOGRAPHY --- */}
        <h1 className="text-[10rem] md:text-[14rem] font-black text-white/5 leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none -z-10 blur-sm">
            404
        </h1>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight relative z-10">
          Oops! Kitchen's closed here.
        </h2>
        
        <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed relative z-10">
          Looks like the page you ordered got <span className="text-[#f97316] font-bold">86'd</span> from the menu. We can't find it anywhere back here.
        </p>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
           {/* Primary Button - Using <a> instead of <Link> for 404 to ensure a clean state reset */}
           <a 
             href="/" 
             className="bg-[#f97316] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-[#f97316]/20 active:scale-95"
           >
             <Home size={20} strokeWidth={2.5} /> Back to Home
           </a>
           
           <a 
             href="/#menu-section" 
             className="bg-[#1a1a1a] border border-gray-800 text-white hover:border-[#f97316]/50 hover:bg-[#222] px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
           >
             <Search size={20} strokeWidth={2.5} /> Browse Menu
           </a>
        </div>
      </div>

      {/* FIXED: Using a CSS Gradient instead of a missing PNG file to avoid the 404 loop */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>
    </div>
  );
}