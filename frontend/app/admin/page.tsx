"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import { LayoutDashboard, TrendingUp, Users, Package, Wallet, ArrowUpRight, CreditCard, Shield, Trophy, BarChart3, LogOut } from "lucide-react"; 

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  // --- NEW: Authorization State ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter(); 

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/logs/login`);
      const data = await res.json();
      setLogs(data.slice(0, 5)); 
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => {
    // --- ROBUST CLIENT-SIDE SECURITY PASS ---
    const role = localStorage.getItem("userRole");
    
    if (!role || (role !== "Admin" && role !== "Developer")) {
      alert("Unauthorized Access. Admin privileges required.");
      router.push("/login"); 
      return; 
    }

    // If authorized, unlock the screen and fetch data
    setIsAuthorized(true);
    fetchStats();
    fetchLogs(); 
    
    const interval = setInterval(() => {
        fetchStats();
        fetchLogs(); 
    }, 10000); 
    
    return () => clearInterval(interval);
  }, [router]);

  // --- NEW: SECURE LOGOUT HANDLER ---
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    document.cookie = "citygrub_staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const maxStaffRevenue = stats?.staff_performance?.length 
    ? Math.max(...stats.staff_performance.map((s: any) => s.revenue)) 
    : 1;

  // --- PREVENT RENDER IF NOT AUTHORIZED ---
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="flex flex-wrap items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#f97316] p-2 rounded-lg">
            <LayoutDashboard size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CityGrub Admin</h1>
          
          <div className="hidden md:block text-sm text-gray-500 bg-gray-900 px-4 py-1.5 rounded-full border border-gray-800 ml-4">
            Real-time Analytics Active
          </div>
        </div>
        
        {/* ADDED LOGOUT BUTTON FOR ADMIN */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-950/30 text-red-500 hover:bg-red-900/50 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <Link href="/admin/sales" className="block">
            <StatCard title="Total Revenue" value={`KES ${stats?.total_revenue || 0}`} icon={<TrendingUp className="text-green-500" />} trend="+12%" />
        </Link>
        <Link href="/admin/sales" className="block">
            <StatCard title="M-Pesa Sales" value={stats?.mpesa_orders || 0} icon={<Wallet className="text-blue-500" />} trend="STK Active" />
        </Link>
        <Link href="/admin/sales" className="block">
            <StatCard title="Cash Sales" value={stats?.cash_orders || 0} icon={<Users className="text-[#f97316]" />} trend="Physical" />
        </Link>
        <Link href="/admin/sales" className="block">
            <StatCard title="Card Sales" value={stats?.card_orders || 0} icon={<CreditCard className="text-purple-500" />} trend="Terminal" />
        </Link>
        <Link href="/kitchen" className="block">
            <StatCard title="Active Tables" value="8" icon={<Package className="text-teal-500" />} trend="Live" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: RECENT TRANSACTIONS & SECURITY */}
        <div className="lg:col-span-2 bg-[#141414] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Recent Paid Orders <ArrowUpRight size={18} className="text-gray-500" />
          </h2>
          <div className="space-y-4">
            {stats?.recent_sales?.map((sale: any) => (
              <Link href={`/admin/orders/${sale.id}`} key={sale.id} className="block group">
                <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-gray-800/50 group-hover:border-[#f97316]/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[#f97316]">
                      #{sale.id}
                    </div>
                    <div>
                      <p className="font-bold text-gray-200">Table {sale.table}</p>
                      <p className="text-xs text-gray-500 uppercase">{sale.method.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1 rounded-full">
                    Confirmed
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 border-t border-gray-800 pt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Security Activity <Shield size={18} className="text-[#f97316]" />
            </h2>
            <div className="space-y-3">
              {logs.length === 0 ? (
                 <p className="text-sm text-gray-500 italic">No recent login activity.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-sm p-3 bg-[#1a1a1a] rounded-lg border border-gray-800/30">
                    <span><b className="text-[#f97316]">{log.staff_name}</b> <span className="text-gray-500 ml-1">({log.role})</span></span>
                    <span className="text-gray-600 font-mono text-xs">{new Date(log.timestamp).toLocaleString('en-KE')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK MANAGEMENT & PERFORMANCE */}
        <div className="space-y-8">
          
          {/* QUICK MANAGEMENT */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Quick Management</h2>
            <div className="space-y-3">
              <AdminButton label="View Full Sales Report" href="/admin/sales" />
              <AdminButton label="Staff Permissions" href="/admin/staff" />
              <AdminButton label="System Settings" variant="danger" href="/admin/settings" />
            </div>
          </div>

          {/* STAFF PERFORMANCE CHART */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Top Performers
              <BarChart3 size={20} className="text-gray-500" />
            </h2>
            
            <div className="space-y-5">
              {!stats?.staff_performance || stats.staff_performance.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No sales data recorded today.</p>
              ) : (
                stats.staff_performance.map((staff: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy size={14} className="text-yellow-500" />}
                        <span className={`font-bold ${index === 0 ? "text-white" : "text-gray-400"}`}>
                          {staff.name}
                        </span>
                      </div>
                      <span className="font-mono text-gray-300">KES {staff.revenue.toLocaleString()}</span>
                    </div>
                    {/* The Visual Bar */}
                    <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                          index === 0 ? "bg-[#f97316]" : index === 1 ? "bg-[#f97316]/70" : "bg-[#f97316]/40"
                        }`}
                        style={{ width: `${(staff.revenue / maxStaffRevenue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl hover:border-[#f97316]/30 transition-all h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-900 rounded-lg">{icon}</div>
        <span className="text-xs font-bold text-gray-500">{trend}</span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  );
}

function AdminButton({ label, variant = "default", href }: any) {
  return (
    <Link href={href || "#"} className="block">
        <button className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
        variant === "danger" ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-gray-800 text-gray-300 hover:bg-[#f97316] hover:text-black"
        }`}>
        {label}
        </button>
    </Link>
  );
}