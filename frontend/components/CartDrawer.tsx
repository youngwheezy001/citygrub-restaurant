"use client";

import { useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronLeft, Info } from "lucide-react";
import { useCart } from "../context/CartContext";
import CheckoutForm from "./CheckoutForm"; 

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartTotal = cart.reduce((total, item) => {
    const numericPrice = parseInt(item.price.replace(/\D/g, ""));
    return total + numericPrice * item.quantity;
  }, 0);

  const handleClose = () => {
    setIsCheckingOut(false);
    closeCart();
  };

  return (
    <>
      {/* 1. BLURRED OVERLAY */}
      {isCartOpen && (
        <div 
          onClick={handleClose} 
          className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-md z-[90] animate-in fade-in duration-300"
        />
      )}

      {/* 2. SLIDING DRAWER WITH GLASSMORPHISM */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-brand-surface/95 backdrop-blur-2xl border-l border-white/5 z-[100] transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${
          isCartOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-brand-surface/50">
          <h2 className="text-xl font-bold flex items-center gap-3">
            {isCheckingOut ? (
              <button 
                onClick={() => setIsCheckingOut(false)} 
                className="flex items-center gap-1 text-brand-muted hover:text-brand-orange transition-colors group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="text-sm font-semibold uppercase tracking-widest">Back</span>
              </button>
            ) : (
              <>
                <ShoppingBag className="text-brand-orange" size={24} strokeWidth={2.5} /> 
                <span className="tracking-tight">Your Order</span>
              </>
            )}
          </h2>
          <button onClick={handleClose} className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 hover:text-brand-orange transition-colors text-brand-muted">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* --- VIEW TOGGLE --- */}
        {isCheckingOut ? (
          <div className="flex-grow p-6 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <CheckoutForm 
              subtotal={cartTotal} 
              onSubmitOrder={async (orderData: any) => {
                const waiterName = localStorage.getItem("userName") || "Unknown Waiter";
                const payload = {
                  table_number: orderData.table_number,
                  payment_method: orderData.payment_method,
                  notes: orderData.notes || "",
                  restaurant_id: "agiza_rest_002", 
                  waiter_name: waiterName, 
                  total: cartTotal,
                  items: cart.map(item => ({
                    menu_item_id: item.id,
                    name: item.name,
                    quantity: item.quantity
                  }))
                };
                
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  if (response.ok) {
                    alert(`✅ Order for Table ${orderData.table_number} sent to Kitchen!`);
                    if (clearCart) clearCart(); 
                    handleClose(); 
                  } else {
                    alert("❌ Failed to send order to kitchen. Check backend connection.");
                  }
                } catch (error) {
                  console.error("Order submission failed:", error);
                  alert("❌ Connection error. Is the server running?");
                }
              }} 
            />
          </div>
        ) : (
          <>
            {/* CART ITEMS LIST */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-muted opacity-80 gap-6 animate-in fade-in zoom-in duration-500">
                  <div className="bg-white/5 p-8 rounded-full border border-white/5">
                    <ShoppingBag size={48} strokeWidth={1.5} className="text-brand-orange" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">Your cart is empty</h3>
                    <p className="text-sm">Looks like you haven't made your choice yet.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* HELPFUL BANNER */}
                  <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-xl p-3 flex items-start gap-3 mb-2 animate-in slide-in-from-top-4 duration-500">
                    <Info size={16} className="text-brand-orange shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-orange leading-tight font-medium">
                      Review your items below. You can add special instructions on the next screen.
                    </p>
                  </div>

                  {/* ITEMS */}
                  {cart.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="flex gap-4 items-center bg-brand-charcoal p-3 sm:p-4 rounded-2xl border border-white/5 shadow-sm group hover:border-brand-orange/30 transition-colors animate-in slide-in-from-right-8 duration-500"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl border border-white/5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      
                      <div className="flex-grow flex flex-col justify-between h-full py-1">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 text-white">{item.name}</h4>
                          <p className="text-brand-orange font-black text-sm mt-1">{item.price}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 bg-brand-surface border border-white/10 px-1 py-1 rounded-full shadow-inner">
                            <button onClick={() => updateQuantity(item.id, "decrease")} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-brand-orange transition-colors"><Minus size={14} strokeWidth={3} /></button>
                            <span className="text-xs font-bold w-6 text-center text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, "increase")} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-orange bg-white/5 text-white transition-colors"><Plus size={14} strokeWidth={3} /></button>
                          </div>
                          
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* FOOTER TOTALS */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-brand-charcoal/80 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-brand-muted font-medium tracking-wide text-sm">Estimated Total</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">Ksh {cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setIsCheckingOut(true)} 
                  className="w-full bg-brand-orange hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-brand-orange/20 active:scale-95"
                >
                  Proceed to Checkout <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}