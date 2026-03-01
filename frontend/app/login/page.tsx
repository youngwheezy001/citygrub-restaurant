"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, User } from "lucide-react";

export default function StaffLogin() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // Kept to avoid changing your imports, though window.location handles the routing now

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleLogin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError("");

    // --- 1. THE DEVELOPER (YOU) ---
    // This is the only way to reach the /developer routes.
    if (pin === "9999") {
      localStorage.setItem("userRole", "Developer");
      localStorage.setItem("userName", "System Admin");
      
      // ADD THE SECURE COOKIE FOR MIDDLEWARE
      document.cookie = `citygrub_staff_token=developer_session; path=/; max-age=86400`;
      
      // HARD REDIRECT SO MIDDLEWARE CHECKS THE NEW COOKIE
      window.location.href = "/developer/menu";
      return; 
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/staff`);
      const staffMembers = await res.json();
      
      // Find the staff member in your database (FIXED: Converts database PIN to string to guarantee a match)
      const user = staffMembers.find((s: any) => String(s.pin) === pin);

      if (user) {
        // --- 2. THE ADMIN / MANAGER ---
        // We save their specific role so the "Security Bouncer" knows who they are.
        localStorage.setItem("userRole", user.role);
        // Save name for the Checkout Form Waiter Tracking
        localStorage.setItem("userName", user.name || user.role); 

        // ADD THE SECURE COOKIE FOR MIDDLEWARE
        document.cookie = `citygrub_staff_token=valid_session; path=/; max-age=86400`;

        // HARD REDIRECTS BASED ON ROLE
        if (user.role === "Admin" || user.role === "Manager") {
          window.location.href = "/admin"; // Leads to Sales, Staff, and Analytics
        } 
        // --- 3. THE OPERATIONS STAFF ---
        else if (user.role === "Chef") {
          window.location.href = "/kitchen";
        } else if (user.role === "Waiter") {
          window.location.href = "/waiter";
        }
      } else {
        setError("Invalid PIN. Access Denied.");
        setPin("");
      }
    } catch (err) {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-[#141414] border border-gray-800 rounded-[2.5rem] p-8 text-center shadow-2xl">
        <div className="bg-[#f97316]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-[#f97316]" size={32} />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">Staff Login</h1>
        <p className="text-gray-500 mb-8 font-medium">Enter your 4-digit security PIN</p>

        {/* PIN DISPLAY */}
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i ? "bg-[#f97316] border-[#f97316] scale-125" : "border-gray-700"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-bold mb-6 animate-pulse">{error}</p>}

        {/* NUMERIC KEYPAD */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === "CLR") setPin("");
                else if (key === "OK") handleLogin();
                else handleKeyPress(key);
              }}
              className={`h-16 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${
                key === "OK" 
                  ? "bg-[#f97316] text-black hover:bg-orange-400" 
                  : "bg-gray-900/50 text-white hover:bg-gray-800 border border-white/5"
              }`}
            >
              {key === "OK" && loading ? <Loader2 className="animate-spin" /> : key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}