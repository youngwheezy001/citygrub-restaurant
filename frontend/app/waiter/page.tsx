"use client";

import { useEffect, useState } from "react";
import { Smartphone, CheckCircle, Clock, Banknote, CreditCard, DollarSign, LogOut, Printer, Download, FileText } from "lucide-react"; 
import { useRouter } from "next/navigation";

export default function WaiterDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [phoneInputs, setPhoneInputs] = useState<{ [key: number]: string }>({});
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false); // NEW: Authorization state
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders?t=${new Date().getTime()}`);
      const data = await response.json();
      const activeOrders = data.filter((order: any) => order.status !== "COMPLETED");
      setOrders(activeOrders);
    } catch (error) { console.error("Failed to fetch orders", error); }
  };

  useEffect(() => {
    // --- ROBUST CLIENT-SIDE SECURITY PASS ---
    const role = localStorage.getItem("userRole");
    
    // Check if role exists AND if it's an authorized role for this page
    const authorizedRoles = ["Waiter", "Admin", "Manager", "Developer"];
    
    if (!role || !authorizedRoles.includes(role)) {
      alert("Unauthorized Access. You must be a Waiter or Admin to view this page.");
      router.push("/login"); 
      return; 
    }

    // If they pass the check, authorize them and load the data
    setCurrentUserRole(role);
    setIsAuthorized(true);
    fetchOrders();
    
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // ... (Rest of your functions: triggerMpesa, markAsPaid, handleLogout, handleEndDayReconciliation, handlePrintReceipt) ...
  const triggerMpesa = async (orderId: number) => {
    const phone = phoneInputs[orderId];
    if (!phone) return alert("Enter phone number first!");

    setLoadingOrderId(orderId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders/${orderId}/pay?phone=${phone}`, {
        method: "POST",
      });
      if (response.ok) {
        alert("✅ STK Push Sent!");
        fetchOrders();
      } else {
        const err = await response.json();
        alert(`❌ STK Failed: ${err.detail}`);
      }
    } catch (error) {
      alert("Connection failed");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const markAsPaid = async (orderId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders/${orderId}/complete`, {
        method: "PUT",
      });
      fetchOrders();
    } catch (error) {
      alert("Status update failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    // Also clear the middleware cookie on logout
    document.cookie = "citygrub_staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const handleEndDayReconciliation = async () => {
    const paidOrders = orders.filter(o => o.status === "PAID");
    
    if (paidOrders.length === 0) {
      alert("No paid orders to compile. Wait for payments to finish.");
      return;
    }

    if (!confirm(`Compile ${paidOrders.length} orders into the Daily Sales Document and clear the board?`)) return;

    const headers = ["Order ID", "Table", "Items", "Method", "Date"];
    const rows = paidOrders.map(order => [
      `#${order.id}`,
      `Table ${order.table_number}`,
      order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(" | "),
      order.payment_method.toUpperCase(),
      new Date().toLocaleString('en-KE')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CityGrub_Shift_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    for (const order of paidOrders) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders/${order.id}/status`, {
          method: "PATCH",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "COMPLETED" })
        });
      } catch (e) {
        console.error(`Failed to complete order ${order.id}`);
      }
    }

    alert("✅ Shift Closed! Document saved and board cleared for tomorrow.");
    fetchOrders(); 
  };

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Please allow pop-ups to generate receipts!");
      return;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt_Order_${order.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; 
              margin: 0 auto; 
              padding: 20px 10px; 
              color: #000; 
              font-size: 14px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 15px 0; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 5px; }
            h2 { margin: 0 0 5px 0; font-size: 24px; }
            p { margin: 0 0 5px 0; font-size: 12px; }
            
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px; padding: 10px; background: #f97316; color: white; border-radius: 8px; cursor: pointer; font-weight: bold;" onclick="window.print()">
            💾 Click to Save as PDF or Print
          </div>

          <div class="text-center">
            <h2>CityGrub</h2>
            <p>Ngong, Kajiado County</p>
            <p>Tel: 0796 766 808</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="flex-between">
            <span>Order #: <b>${order.id}</b></span>
            <span>Table: <b>${order.table_number}</b></span>
          </div>
          <div>Date: ${new Date().toLocaleString('en-KE')}</div>
          
          <div class="divider"></div>
          
          <div class="font-bold flex-between" style="margin-bottom: 10px;">
            <span>QTY  ITEM</span>
          </div>
          
          ${order.items.map((item: any) => `
            <div class="flex-between">
              <span>${item.quantity}x ${item.name}</span>
            </div>
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="text-center font-bold" style="font-size: 16px;">
            STATUS: PAID
          </div>
          <div class="text-center" style="font-size: 12px; margin-top: 5px;">
            Method: ${order.payment_method.replace('_', ' ').toUpperCase()}
          </div>
          
          <div class="divider"></div>
          <div class="text-center font-bold">Thank you for dining with us!</div>
          <div class="text-center" style="margin-top: 20px;">.</div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
  };

  // --- PREVENT RENDER IF NOT AUTHORIZED ---
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#121212]" />; // Show empty dark screen while checking
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6 text-white">
      <header className="flex flex-wrap items-center justify-between mb-8 border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Banknote size={32} className="text-[#f97316]" />
          <h1 className="text-3xl font-bold tracking-wide">Waiter POS</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* UPDATED: ONLY SHOW Z-REPORT BUTTON TO ADMIN/MANAGER/DEV */}
          {(currentUserRole === "Admin" || currentUserRole === "Manager" || currentUserRole === "Developer") && (
            <button 
              onClick={handleEndDayReconciliation}
              className="flex items-center gap-2 bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-[#f97316]/30"
              title="Download Daily Report & Clear Board"
            >
              <FileText size={16} /> End Shift & Report
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/30 text-red-500 hover:bg-red-900/50 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
              <span className="font-bold text-xl">Table {order.table_number}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                order.status === 'PAID' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {order.status === 'PAID' ? 'PAID' : `UNPAID - ${order.payment_method?.toUpperCase() || 'NEW'}`}
              </span>
            </div>

            <div className="p-4 flex-1">
              <ul className="text-sm space-y-2 mb-6">
                {order.items?.map((item: any, i: number) => (
                  <li key={i} className="flex justify-between border-b border-gray-800/50 pb-2">
                    <span className="text-gray-200">{item.quantity}x {item.name}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-2">
                {/* UPDATED: ONLY SHOW GENERATE RECEIPT IF ADMIN/MANAGER/DEV */}
                {order.status === "PAID" && (currentUserRole === "Admin" || currentUserRole === "Manager" || currentUserRole === "Developer") && (
                   <button onClick={() => handlePrintReceipt(order)} className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold flex justify-center gap-2 transition-colors border border-gray-700">
                     <Download size={20} /> Generate Receipt
                   </button>
                )}

                {/* SHOW PAYMENTS IF UNPAID */}
                {order.status !== "PAID" && (
                  <>
                    {(order.payment_method === "mpesa" || order.payment_method === "mpesa_upfront") && (
                      <div className="flex gap-2">
                        <input 
                          type="tel" placeholder="07..." value={phoneInputs[order.id] || ""}
                          onChange={(e) => setPhoneInputs({...phoneInputs, [order.id]: e.target.value})}
                          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#f97316]"
                        />
                        <button onClick={() => triggerMpesa(order.id)} title="Send M-Pesa Prompt" className="bg-green-600 hover:bg-green-500 p-2 rounded-lg transition-colors flex items-center justify-center">
                          {loadingOrderId === order.id ? "..." : <Smartphone size={18} />}
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Manually confirm M-Pesa payment? Use only if the automated system delayed.")) {
                              markAsPaid(order.id);
                            }
                          }} 
                          title="Force Confirm Payment"
                          className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <CheckCircle size={18} />
                        </button>
                      </div>
                    )}

                    {order.payment_method === "cash" && (
                      <button onClick={() => markAsPaid(order.id)} className="w-full bg-emerald-600 py-3 rounded-lg font-bold flex justify-center gap-2">
                        <DollarSign size={20} /> Confirm Cash
                      </button>
                    )}

                    {order.payment_method === "card" && (
                      <button onClick={() => markAsPaid(order.id)} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-lg font-bold flex justify-center gap-2">
                        <CreditCard size={20} /> Confirm Card
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}