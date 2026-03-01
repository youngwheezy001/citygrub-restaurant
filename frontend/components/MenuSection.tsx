"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Flame, Pizza, Beef, Drumstick, Coffee, IceCream, Leaf, Plus, Utensils, SearchX, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import QuickView from "./QuickView"; // <-- Imported the new QuickView component

// --- ICON MAPPER ---
const getIconForCategory = (categoryName: string) => {
  const lower = categoryName.toLowerCase();
  if (lower.includes("burger") || lower.includes("sizzl") || lower.includes("main")) return Beef;
  if (lower.includes("pizza") || lower.includes("snack")) return Pizza;
  if (lower.includes("chicken") || lower.includes("side")) return Drumstick;
  if (lower.includes("drink") || lower.includes("juice") || lower.includes("tea") || lower.includes("coffee") || lower.includes("breakfast")) return Coffee;
  if (lower.includes("dessert") || lower.includes("sweet")) return IceCream;
  if (lower.includes("vegan") || lower.includes("salad") || lower.includes("indian")) return Leaf;
  if (lower.includes("signature") || lower.includes("trend")) return Flame;
  return Utensils; 
};

// --- SKELETON LOADER ---
function MenuSkeleton() {
  return (
    <div className="bg-brand-surface rounded-2xl overflow-hidden border border-white/5 flex flex-col h-full animate-pulse">
      <div className="h-28 md:h-40 w-full bg-white/5"></div>
      <div className="p-3 md:p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          <div className="h-4 md:h-6 bg-white/10 rounded-md w-3/4 mb-2"></div>
          <div className="h-2 md:h-3 bg-white/5 rounded-md w-full mb-1"></div>
          <div className="h-2 md:h-3 bg-white/5 rounded-md w-2/3"></div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="h-4 md:h-5 bg-white/10 rounded-md w-16"></div>
          <div className="h-8 w-8 md:h-11 md:w-11 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// --- ACTUAL MENU LOGIC ---
function MenuContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { addToCart } = useCart();
  
  // --- NEW: STATE FOR QUICK VIEW MODAL ---
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // URL Search Detection
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || ""; 

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ name: "Trending", id: "all", icon: Flame }]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/menu?restaurant_id=agiza_rest_002`);
        const data = await response.json();

        const formattedItems = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: `Ksh ${item.price}`, 
          image: item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
          desc: item.description || ""
        }));

        setMenuItems(formattedItems);

        const uniqueCategoryNames = Array.from(new Set(data.map((item: any) => item.category))) as string[];
        const dynamicCategories = [
          { name: "Trending", id: "all", icon: Flame },
          ...uniqueCategoryNames.map(cat => ({
            name: cat,
            id: cat, 
            icon: getIconForCategory(cat) 
          }))
        ];
        
        setCategories(dynamicCategories);

        await new Promise((resolve) => setTimeout(resolve, 1500));

      } catch (error) {
        console.error("Failed to fetch menu", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // SEARCH & CATEGORY FILTERING
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(query) || 
                          item.desc.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 mb-20">
      
      {/* 1. SECTION TITLE */}
      <h2 className="text-xl md:text-2xl font-bold text-brand-text tracking-tight mb-4 px-1 flex items-center gap-3">
        {query 
          ? `Results for "${query}"` 
          : activeCategory === "all" ? "Trending Near You" : `Menu: ${categories.find(c => c.id === activeCategory)?.name}`}
        {!isLoading && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        )}
      </h2>

      {/* 2. CATEGORY SLIDER */}
      <div className="flex overflow-x-auto gap-3 pb-6 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id; 

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`snap-start shrink-0 flex flex-col items-center justify-center gap-2 w-24 h-24 md:w-28 md:h-28 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105"
                  : "bg-brand-surface border-white/5 text-brand-muted hover:border-brand-orange/50 hover:text-brand-text"
              }`}
            >
              <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-xs text-center px-1 leading-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. THE FOOD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mt-4 transition-all duration-500">
        
        {isLoading ? (
          [...Array(10)].map((_, i) => <MenuSkeleton key={`skeleton-${i}`} />)
        ) : filteredItems.length === 0 ? (
          
          /* NO RESULTS FOUND GRAPHIC */
          <div className="col-span-full py-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-brand-surface p-8 rounded-full border border-white/5 mb-6 relative">
              <SearchX size={64} className="text-brand-orange animate-pulse" />
              <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-lg shadow-xl">
                 <X size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Oops! No cravings found.</h3>
            <p className="text-brand-muted max-w-sm mb-8">
              We couldn't find matches for <span className="text-brand-orange font-bold">"{query}"</span>. 
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Burger", "Pizza", "Chicken", "Drinks", "Indian"].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set("q", tag);
                      window.history.pushState({}, "", `?${params.toString()}`);
                      window.dispatchEvent(new Event("popstate")); 
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:border-brand-orange hover:text-brand-orange transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        ) : (
          
          /* AMPLIFIED WATERFALL ENTRANCE WITH QUICKVIEW CLICK */
          filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)} // <-- OPENS THE MODAL
              className="waterfall-item bg-brand-surface rounded-2xl overflow-hidden border border-white/5 hover:border-brand-orange/30 transition-all duration-300 group flex flex-col shadow-lg cursor-pointer"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative h-28 md:h-40 w-full overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* NEW: HOVER OVERLAY TELLING USER THEY CAN CLICK TO VIEW */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-widest shadow-lg border border-white/20">View Details</span>
                </div>
              </div>
              
              <div className="p-3 md:p-5 flex flex-col flex-grow justify-between bg-brand-surface">
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-brand-text mb-0.5 line-clamp-1">{item.name}</h3>
                  <p className="text-brand-muted text-[10px] md:text-xs line-clamp-2 leading-tight mb-3">
                    {item.desc}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="text-brand-orange font-black text-xs md:text-lg">{item.price}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // <-- CRITICAL: Prevents the modal from opening if they just want to add to cart quickly!
                      addToCart(item);
                    }}
                    className="bg-white/10 hover:bg-brand-orange text-white p-1.5 md:p-3 rounded-full transition-colors flex items-center justify-center group/btn z-10"
                  >
                    <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5 transition-transform group-hover/btn:rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- QUICK VIEW MODAL COMPONENT --- */}
      <QuickView 
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addToCart}
      />

    </div>
  );
}

// WRAP IN SUSPENSE TO STOP BROWSER TAB INFINITE LOADING
export default function MenuSection() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 grid grid-cols-2 md:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => <MenuSkeleton key={`suspense-skeleton-${i}`} />)}
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}