"use client"; // <-- ADDED: Needed to run useEffect on the client browser

import { useEffect } from "react"; // <-- ADDED
import { ArrowRight } from "lucide-react";
import Link from "next/link"; 
import MenuSection from "../components/MenuSection"; 

export default function Home() {

  // --- NEW: QR CODE URL SNIFFER ---
  useEffect(() => {
    // Looks at the web address (e.g., website.com/?table=5)
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");
    
    // If it finds a table number, it locks it into the browser's memory
    if (table) {
      localStorage.setItem("scannedTable", table);
    }
  }, []);
  // --------------------------------

  return (
    <div className="flex flex-col gap-12 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] min-h-[500px] rounded-3xl overflow-hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden">
           <img 
             src="https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=2000" 
             alt="Delicious Burger" 
             className="object-cover w-full h-full" 
           />
           <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-brand-charcoal/90 to-transparent"></div>
        </div>

        <div className="relative h-full flex flex-col justify-center max-w-2xl px-8 md:px-12 z-10">
          <span className="text-brand-orange font-bold tracking-wider uppercase text-sm mb-4">
            🔥 CityGrub Weekend Deal
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Craving it? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-yellow-500">
              Just Order it.
            </span>
          </h1>
          <p className="text-brand-text/80 text-lg md:text-xl mb-8 max-w-md leading-relaxed">
            Hot pizzas, juicy burgers, and crispy chicken delivered to your table. Pay when it arrives!
          </p>
          <div className="flex items-center gap-4">
            
            {/* BUTTON 1: Scrolls down to the quick menu */}
            <Link href="#menu" className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 flex items-center gap-2">
              Order Now <ArrowRight size={20} strokeWidth={3} />
            </Link>
            
            {/* BUTTON 2: Navigates to the full standalone Customer Storefront */}
            <Link href="/menu" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg backdrop-blur-md transition-colors border border-white/10">
              View Menu
            </Link>

          </div>
        </div>
      </section>

      {/* DYNAMIC MENU SECTION */}
      <div id="menu" className="scroll-mt-24"> 
        <MenuSection />
      </div>

    </div>
  );
}