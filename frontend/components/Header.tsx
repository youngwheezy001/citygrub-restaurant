"use client";

import Link from "next/link";
import { ShoppingBag, Search, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useCart } from "../context/CartContext"; 
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';

// We put SearchBar in its own function to wrap it in Suspense
function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (searchValue) {
        params.set("q", searchValue);
      } else {
        params.delete("q");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, router]);

  return (
    <div className="flex-1 max-w-md relative group mx-2 sm:mx-4">
      <div className="relative flex items-center bg-brand-surface/30 backdrop-blur-md border border-white/10 rounded-full overflow-hidden focus-within:border-brand-orange/40 transition-all">
        
        {/* GOOGLE-STYLE RING AROUND ICON */}
        <div className="pl-4 relative flex items-center justify-center">
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full border-2 border-transparent border-t-blue-500 border-r-red-500 border-b-yellow-500 border-l-green-500 animate-spin opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <Search className="relative z-10 text-brand-muted group-focus-within:text-white" size={18} />
        </div>

        <input 
          type="text"
          placeholder="Search for food..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-transparent py-3 pl-3 pr-10 text-xs sm:text-sm text-white outline-none placeholder:text-gray-500"
        />
        
        {searchValue && (
          <button onClick={() => setSearchValue("")} className="absolute right-4 text-brand-muted hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartCount, openCart } = useCart(); 
  const [isBopping, setIsBopping] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      setIsBopping(true);
      const timer = setTimeout(() => setIsBopping(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-brand-charcoal/90 backdrop-blur-md border-b border-white/10 py-3 shadow-lg" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        
        <Link href="/" className="shrink-0 flex items-center">
          {/* I swapped next/image for a standard img tag temporarily to bypass any Next.js image cache errors */}
          <img 
            src="/logo.png" 
            alt="CityGrub Logo" 
            className="object-contain w-[100px] sm:w-[140px] md:w-[180px] transition-transform hover:scale-105" 
          />
        </Link>

        {/* This Suspense block is what stops the "Infinite Loading" tab spinner */}
        <Suspense fallback={<div className="flex-1 max-w-md h-12 bg-white/5 rounded-full mx-4" />}>
          <SearchBar />
        </Suspense>

        <div className="shrink-0 flex items-center">
          <button onClick={openCart} className={`relative flex items-center justify-center bg-brand-surface p-2 sm:p-2.5 rounded-full border transition-all duration-300 group ${isBopping ? "border-brand-orange scale-110 shadow-lg shadow-brand-orange/30" : "border-white/5 hover:border-brand-orange/50"}`}>
            <ShoppingBag size={22} className={`transition-colors ${isBopping ? "text-brand-orange" : "text-brand-text group-hover:text-brand-orange"}`} strokeWidth={2.5} />
            {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-brand-charcoal animate-in zoom-in">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}