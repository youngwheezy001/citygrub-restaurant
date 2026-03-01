"use client";

import { useEffect, useState } from "react";
import { Loader2, Utensils, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

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
      
      const uniqueCategories = Array.from(new Set(formattedItems.map((item: any) => item.category))) as string[];
      setCategories(["All", ...uniqueCategories]);
    } catch (error) {
      console.error("Failed to load menu", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMenu(); 
  }, []);

  const filteredItems = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-brand-charcoal text-white pb-32 font-sans relative">
      <header className="bg-brand-charcoal/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 pt-4">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === category 
                  ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                  : "bg-brand-surface border border-white/5 text-brand-muted hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange" size={40} /></div>
        ) : (
          /* COMPRESSED GRID: grid-cols-2 on mobile, smaller gap */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mt-4 transition-all duration-500">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-brand-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300">
                
                {/* COMPRESSED IMAGE BOX: h-28 on mobile, h-40 on desktop */}
                <div className="relative h-28 md:h-40 w-full overflow-hidden bg-black/50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-800">
                      <Utensils size={24} />
                    </div>
                  )}
                </div>
                
                {/* COMPRESSED CONTENT BOX: Tighter padding, smaller text */}
                <div className="p-3 md:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm md:text-lg font-bold text-brand-text mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-brand-muted text-[10px] md:text-xs mb-3 line-clamp-2 leading-tight">{item.desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <span className="text-brand-orange font-black text-xs md:text-sm">{item.price}</span>
                    
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-white/10 hover:bg-brand-orange text-white p-2 md:p-2.5 rounded-full transition-colors flex items-center justify-center"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}