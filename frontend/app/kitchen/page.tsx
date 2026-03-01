"use client";

import { useEffect, useState, useRef } from "react";
import { ChefHat, Clock, CheckCircle, Volume2, LogOut } from "lucide-react"; 
import { useRouter } from "next/navigation"; 

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // NEW: Authorization state
  const router = useRouter(); 
  
  const latestOrderId = useRef<number>(0);

  const playDing = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch((err) => console.log("Browser blocked sound until user interacts", err));
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();
      
      // Filter out BOTH Completed and Paid orders
      const activeOrders = data.filter((order: any) => 
        order.status !== "COMPLETED" && order.status !== "PAID"
      );
      
      if (activeOrders.length > 0) {
        const maxId = Math.max(...activeOrders.map((o: any) => o.id));
        
        if (latestOrderId.current !== 0 && maxId > latestOrderId.current) {
          playDing(); 
        }
        
        latestOrderId.current = maxId;
      }

      setOrders(activeOrders);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };

  useEffect(() => {
    // --- ROBUST CLIENT-SIDE SECURITY PASS ---
    const role = localStorage.getItem("userRole");
    const authorizedRoles = ["Chef", "Admin", "Manager", "Developer"];

    if (!role || !authorizedRoles.includes(role)) {
      alert("Unauthorized Access. You must be Kitchen Staff or Admin to view this page.");
      router.push("/login"); 
      return; 
    }

    // If authorized, grant access and start fetching
    setIsAuthorized(true);
    fetchOrders();

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('http', 'ws');
    const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID || "agiza_citygrub_002"; 
    const ws = new WebSocket(`${wsUrl}/ws/kitchen/${restaurantId}`); 

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === "NEW_ORDER") {
          console.log("⚡ INSTANT PING RECEIVED! Fetching latest orders...");
          fetchOrders(); 
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => ws.close();
  }, [router]);

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders/${orderId}/complete`, {
        method: "PUT",
      });

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error("Failed to complete order", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    // Clear the middleware cookie on logout
    document.cookie = "citygrub_staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  // --- PREVENT RENDER IF NOT AUTHORIZED ---
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#121212]" />; // Empty dark screen while checking
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <header className="flex flex-wrap items-center gap-3 mb-8 border-b border-gray-800 pb-4">
        <ChefHat size={32} className="text-[#f97316]" />
        <h1 className="text-3xl font-bold tracking-wide">Live Kitchen Display</h1>
        
        <button 
          onClick={() => {
            setSoundEnabled(true);
            playDing(); 
          }}
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            soundEnabled ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <Volume2 size={16} />
          {soundEnabled ? "Sound On" : "Click to Enable Sound"}
        </button>

        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full text-sm font-medium">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Receiving
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-950/30 text-red-500 hover:bg-red-900/50 px-4 py-2 rounded-xl text-sm font-bold transition-colors ml-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <ChefHat size={64} className="mb-4 opacity-20" />
          <p className="text-xl">No active orders.</p>
          <p className="text-sm">Waiting for guests to get hungry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
              
              <div className="bg-gray-800 p-4 flex justify-between items-center">
                <span className="font-bold text-lg text-white">Table {order.table_number}</span>
                <span className="text-sm font-mono text-gray-400 flex items-center gap-1">
                  <Clock size={14} /> #{order.id}
                </span>
              </div>

              {order.notes && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-3 text-red-200 text-sm font-medium">
                  ⚠️ Note: {order.notes}
                </div>
              )}

              <div className="p-4 flex-1 space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start border-b border-gray-800/50 pb-2 last:border-0">
                    <div className="flex gap-3">
                      <span className="font-bold text-[#f97316]">{item.quantity}x</span>
                      <span className="text-gray-200">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleCompleteOrder(order.id)}
                className="mt-auto w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={20} /> Mark as Ready
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}