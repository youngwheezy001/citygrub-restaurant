"use client";

import { useState, useEffect, Suspense } from "react"; 
import { useSearchParams } from "next/navigation";
import { MapPin, MessageSquare, Smartphone, Banknote, CreditCard, ArrowRight, CheckCircle2, Loader2, Info } from "lucide-react";
import { useCart } from "../context/CartContext"; 

function CheckoutContent({ 
  subtotal = 850, 
  onSubmitOrder 
}: { 
  subtotal?: number; 
  onSubmitOrder?: (data: any) => void; 
}) {
  const searchParams = useSearchParams();
  const urlTableNumber = searchParams.get("table");

  const { cart, clearCart } = useCart();

  const [tableNumber, setTableNumber] = useState(urlTableNumber || "");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  
  const [isTableLocked, setIsTableLocked] = useState(false);

  useEffect(() => {
    const savedTable = localStorage.getItem("scannedTable");
    if (savedTable) {
      setTableNumber(savedTable);
      setIsTableLocked(true);
    } else if (urlTableNumber) {
      setIsTableLocked(true);
    }
  }, [urlTableNumber]);

  const handleConfirm = async () => {
    if (!tableNumber || tableNumber === "") {
      alert("⚠️ Please select a valid Table Number so we know where to bring your food!");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      restaurant_id: process.env.NEXT_PUBLIC_RESTAURANT_ID || "agiza_citygrub_002",
      table_number: tableNumber,
      payment_method: paymentMethod,
      notes: notes,
      total: subtotal,
      items: cart.map((item) => ({
        menu_item_id: item.id,
        name: item.name,
        price: parseInt(item.price.replace(/\D/g, "") || "0"), 
        quantity: item.quantity,
      })),
    };
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) throw new Error("Failed to send order");

      const data = await response.json();
      
      setOrderId(data.order_id);
      setIsSuccess(true);
      clearCart(); 

      if (onSubmitOrder) {
        onSubmitOrder(data);
      }
    } catch (error: any) {
      console.error("Order Error:", error);
      alert(`The exact error is: ${error.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUCCESS SCREEN ---
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <CheckCircle2 size={80} className="text-green-500 relative z-10" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Order Received!</h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-[250px] mx-auto">
            The kitchen is preparing your food. It will be brought to <strong className="text-white">Table {tableNumber}</strong> shortly.
          </p>
        </div>
        <div className="bg-brand-surface/80 border border-white/10 p-5 rounded-2xl w-full max-w-sm shadow-inner mt-4">
          <p className="text-xs text-brand-muted uppercase tracking-widest font-bold mb-1">Order Number</p>
          <p className="text-2xl font-mono text-brand-orange font-black tracking-widest">{orderId || "WAITING"}</p>
        </div>
      </div>
    );
  }

  // --- CHECKOUT FORM ---
  return (
    <div className="flex flex-col h-full text-white animate-in slide-in-from-right-8 duration-500">
      
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 [&::-webkit-scrollbar]:hidden">
        
        {/* SECTION 1: Table Number */}
        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <MapPin size={16} className="text-brand-orange" strokeWidth={3} /> 
            Where are you sitting?
          </label>
          
          {isTableLocked ? (
            <div className="w-full bg-brand-orange/10 border border-brand-orange/30 rounded-xl px-4 py-4 text-brand-orange flex items-center justify-between shadow-inner">
              <span className="font-black text-xl tracking-tight">Table {tableNumber}</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-brand-orange/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-brand-orange/20">
                <CheckCircle2 size={12} strokeWidth={3} /> QR Scanned
              </span>
            </div>
          ) : (
            <div className="relative">
              <select 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>-- Select your table --</option>
                {[...Array(20)].map((_, index) => (
                  <option key={index + 1} value={`${index + 1}`}>
                    Table {index + 1}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-muted">
                ▼
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Kitchen Notes */}
        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-200">
          <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <MessageSquare size={16} className="text-brand-orange" strokeWidth={3} /> 
            Notes for the Kitchen
          </label>
          <textarea 
            placeholder="No onions, extra spicy, allergies..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3.5 text-white font-medium placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 transition-all resize-none shadow-inner"
          />
        </div>

        {/* SECTION 3: Payment Intent */}
        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <label className="text-sm font-bold text-white uppercase tracking-wider block mb-3 flex items-center gap-2">
             <Banknote size={16} className="text-brand-orange" strokeWidth={3} />
             Payment Method
          </label>
          <div className="bg-brand-surface/50 border border-white/5 rounded-xl p-3 flex items-start gap-3 mb-4">
             <Info size={16} className="text-brand-muted shrink-0 mt-0.5" />
             <p className="text-xs text-brand-muted leading-tight font-medium">
               Select how you'd like to pay. We will collect payment after you've enjoyed your meal!
             </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            
            <button 
              onClick={() => setPaymentMethod("mpesa")}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                paymentMethod === "mpesa" 
                  ? "border-brand-orange bg-brand-orange/10 shadow-inner" 
                  : "border-white/5 bg-brand-surface hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone size={20} className={paymentMethod === "mpesa" ? "text-brand-orange" : "text-brand-muted"} strokeWidth={2.5} />
                <span className={`font-bold ${paymentMethod === "mpesa" ? "text-white" : "text-brand-muted"}`}>M-Pesa on Delivery</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === "mpesa" ? "border-brand-orange" : "border-brand-muted"}`}>
                 {paymentMethod === "mpesa" && <div className="w-2 h-2 rounded-full bg-brand-orange"></div>}
              </div>
            </button>

            <button 
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                paymentMethod === "card" 
                  ? "border-brand-orange bg-brand-orange/10 shadow-inner" 
                  : "border-white/5 bg-brand-surface hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={20} className={paymentMethod === "card" ? "text-brand-orange" : "text-brand-muted"} strokeWidth={2.5} />
                <span className={`font-bold ${paymentMethod === "card" ? "text-white" : "text-brand-muted"}`}>Card at Terminal</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === "card" ? "border-brand-orange" : "border-brand-muted"}`}>
                 {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-brand-orange"></div>}
              </div>
            </button>

            <button 
              onClick={() => setPaymentMethod("cash")}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                paymentMethod === "cash" 
                  ? "border-brand-orange bg-brand-orange/10 shadow-inner" 
                  : "border-white/5 bg-brand-surface hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Banknote size={20} className={paymentMethod === "cash" ? "text-brand-orange" : "text-brand-muted"} strokeWidth={2.5} />
                <span className={`font-bold ${paymentMethod === "cash" ? "text-white" : "text-brand-muted"}`}>Cash to Waiter</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === "cash" ? "border-brand-orange" : "border-brand-muted"}`}>
                 {paymentMethod === "cash" && <div className="w-2 h-2 rounded-full bg-brand-orange"></div>}
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* FOOTER: Confirm Button */}
      <div className="pt-6 mt-4 border-t border-white/5 bg-brand-charcoal">
        <div className="flex justify-between items-center mb-4">
          <span className="text-brand-muted font-medium tracking-wide text-sm">Total Due</span>
          <span className="text-2xl font-black text-white">Ksh {subtotal.toLocaleString()}</span>
        </div>
        
        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:bg-brand-surface disabled:text-brand-muted disabled:border disabled:border-white/10 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-orange/20"
        >
          {isSubmitting ? (
            <> <Loader2 size={20} className="animate-spin" /> Sending to Kitchen... </>
          ) : (
            <> Send to Kitchen <ArrowRight size={20} strokeWidth={2.5} /> </>
          )}
        </button>
      </div>
    </div>
  );
}

// WRAP IN SUSPENSE TO PREVENT BUILD/LOADING ERRORS
export default function CheckoutForm(props: any) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
        <p className="text-brand-muted text-sm animate-pulse">Loading checkout...</p>
      </div>
    }>
      <CheckoutContent {...props} />
    </Suspense>
  );
}