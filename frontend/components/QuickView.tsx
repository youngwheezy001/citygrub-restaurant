"use client";

import { X, ShoppingBag, Plus } from "lucide-react";
import Image from "next/image";

interface QuickViewProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

export default function QuickView({ item, isOpen, onClose, onAddToCart }: QuickViewProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* MODAL CONTENT */}
      <div className="relative bg-brand-surface w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/40 p-2 rounded-full text-white hover:bg-brand-orange transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* IMAGE SIDE */}
          <div className="relative h-64 md:h-auto md:w-1/2 overflow-hidden">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* TEXT SIDE */}
          <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <span className="text-brand-orange text-xs font-bold uppercase tracking-widest">{item.category}</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-1 mb-4">{item.name}</h2>
              <p className="text-brand-muted text-sm md:text-base leading-relaxed mb-6">
                {item.desc || "Our chef's special recipe, prepared fresh with premium ingredients just for you."}
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-2xl font-black text-brand-orange">{item.price}</span>
              <button 
                onClick={() => {
                  onAddToCart(item);
                  onClose();
                }}
                className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-orange/20"
              >
                <Plus size={18} strokeWidth={3} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}