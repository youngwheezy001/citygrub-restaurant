"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Filter, DollarSign, Smartphone, Banknote, Receipt, Loader2, CreditCard, Download, Trash2, Printer, X } from "lucide-react"; // ADDED PRINTER AND X

export default function SalesReport() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // NEW STATE FOR RECEIPT MODAL
  
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    // --- NEW: SECURITY BOUNCER ---
    const role = localStorage.getItem("userRole");
    if (!role || (role !== "Admin" && role !== "Developer")) {
      window.location.href = "/login"; // Bounces unauthorized users out instantly
      return; 
    }

    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders`);
        const ordersData = await ordersRes.json();
        setOrders(ordersData.reverse());
      } catch (error) {
        console.error("Failed to fetch sales data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // NEW: PRINT HANDLER
  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    const headers = ["Order ID", "Table", "Items", "Payment Method", "Status", "Date"];
    const rows = filteredOrders.map(order => [
      `#${order.id}`,
      `Table ${order.table_number}`,
      order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(" | "),
      order.payment_method.toUpperCase(),
      order.status,
      new Date().toLocaleDateString('en-KE')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CityGrub_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const voidOrder = async (id: number) => {
    if (!confirm(`VOID ORDER #${id}? This will remove it from all revenue totals and cannot be undone.`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/orders/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      alert("Failed to void order. Check backend connection.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) || 
      order.table_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPayment = 
      paymentFilter === "all" || 
      (paymentFilter === "mpesa" && order.payment_method.includes("mpesa")) ||
      (paymentFilter === "cash" && order.payment_method === "cash") ||
      (paymentFilter === "card" && order.payment_method === "card");

    return matchesSearch && matchesPayment;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8 font-sans">
      
      {/* PRINT-ONLY CSS */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-modal, #receipt-modal * { visibility: visible; }
          #receipt-modal { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-[#141414] border border-gray-800 rounded-xl hover:bg-[#f97316] hover:text-black transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Sales & Receipts</h1>
        </div>
        
        <button 
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="flex items-center gap-2 bg-[#f97316] text-black px-6 py-3 rounded-xl font-bold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Download size={20} /> Export to CSV
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 no-print">
        <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={24} /></div>
          </div>
          <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-3xl font-black text-white">KES {stats?.total_revenue || 0}</h3>
        </div>
        <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Smartphone size={24} /></div>
          </div>
          <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-wider">M-Pesa Orders</p>
          <h3 className="text-3xl font-black text-white">{stats?.mpesa_orders || 0}</h3>
        </div>
        <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#f97316]/10 text-[#f97316] rounded-xl"><Banknote size={24} /></div>
          </div>
          <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-wider">Cash Orders</p>
          <h3 className="text-3xl font-black text-white">{stats?.cash_orders || 0}</h3>
        </div>
        <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><CreditCard size={24} /></div>
          </div>
          <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-wider">Card Orders</p>
          <h3 className="text-3xl font-black text-white">{stats?.card_orders || 0}</h3>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-[#141414] border border-gray-800 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order # or Table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#f97316] text-sm"
          />
        </div>
        
        <div className="relative md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#f97316] text-sm appearance-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="mpesa">M-Pesa Only</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Only</option>
          </select>
        </div>
      </div>

      <main className="max-w-7xl mx-auto bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden no-print">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-[#f97316]" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-widest text-gray-500">
                  <th className="p-5 font-bold">Order ID</th>
                  <th className="p-5 font-bold">Table</th>
                  <th className="p-5 font-bold">Items</th>
                  <th className="p-5 font-bold">Method</th>
                  <th className="p-5 font-bold text-right">Status & Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      <Receipt size={40} className="mx-auto mb-3 opacity-20" />
                      No orders match your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-5 font-bold text-white">#{order.id}</td>
                      <td className="p-5 text-gray-300">Table {order.table_number}</td>
                      <td className="p-5 text-gray-400 max-w-[200px] truncate">
                        {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                          order.payment_method.includes('mpesa') ? 'bg-blue-500/10 text-blue-400' :
                          order.payment_method === 'card' ? 'bg-purple-500/10 text-purple-400' : 
                          'bg-[#f97316]/10 text-[#f97316]'
                        }`}>
                          {order.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-5 flex items-center justify-end gap-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                          order.status === 'PAID' || order.status === 'COMPLETED' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                        
                        {/* RECEIPT BUTTON */}
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-gray-400 hover:text-[#f97316] transition-colors p-1"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>

                        <button 
                          onClick={() => voidOrder(order.id)}
                          className="text-gray-600 hover:text-red-500 transition-colors p-1"
                          title="Void Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print">
          <div id="receipt-modal" className="bg-white text-black w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b no-print">
              <span className="font-bold text-gray-500">Receipt Preview</span>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black"><X size={24} /></button>
            </div>
            
            <div className="p-8 font-mono text-sm leading-relaxed">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase">CityGrub</h2>
                <p>Kilimanjaro Jamia, Nairobi</p>
                <p className="text-xs">Tel: +254 700 000 000</p>
              </div>

              <div className="border-y border-dashed py-3 mb-4 flex justify-between">
                <span>Order: #{selectedOrder.id}</span>
                <span>Table: {selectedOrder.table_number}</span>
              </div>

              <div className="space-y-2 mb-6">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>KES {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-black pt-3 flex justify-between font-black text-lg">
                <span>TOTAL</span>
                <span>KES {selectedOrder.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)}</span>
              </div>

              <div className="mt-6 text-center text-xs opacity-70">
                <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
                <p>{new Date().toLocaleString()}</p>
                <p className="mt-4">*** Thank you for dining with us! ***</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3 no-print">
               <button onClick={handlePrint} className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                 <Printer size={18} /> Print Now
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}