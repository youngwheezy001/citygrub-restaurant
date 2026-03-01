"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import { ChevronLeft, UserPlus, ShieldCheck, Key, Trash2, Users, X, RotateCcw } from "lucide-react";

export default function StaffPermissions() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", username: "", role: "Waiter", pin: "" });
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null); 
  const router = useRouter(); 

  const fetchStaff = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/staff');
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    // Ensure only Admin or Developer can access this page
    if (!role || (role !== "Admin" && role !== "Developer")) {
      router.push("/login"); 
      return; 
    }
    
    // Explicitly set the role state to trigger the UI update
    setCurrentUserRole(role); 
    fetchStaff();
  }, [router]);

  const resetStaffPin = async (id: number, name: string) => {
  const newPin = window.prompt(`Enter new 4-digit PIN for ${name}:`, "1234");

  if (newPin === null) return;
  if (newPin.length !== 4 || isNaN(Number(newPin))) {
    alert("❌ Error: PIN must be exactly 4 digits.");
    return;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newPin })
    });
    
    if (res.ok) {
      alert(`✅ PIN for ${name} updated to ${newPin}`);
      // --- THE FIX: Call fetchStaff() to refresh the list on screen ---
      fetchStaff(); 
    } else {
      alert("❌ Backend rejected the update. Check main.py logs.");
    }
  } catch (err) {
    alert("❌ Connection failed. Is your backend server running?");
  }
};

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setNewStaff({ name: "", username: "", role: "Waiter", pin: "" });
        fetchStaff();
      } else {
        const errorData = await res.json();
        alert(`❌ Server Error: ${errorData.detail || 'Check if the username is unique'}`);
      }
    } catch (err) {
      alert("❌ Connection failed.");
    }
  };

  const deleteStaff = async (id: number) => {
    if (confirm("Remove this team member? This action cannot be undone.")) {
      await fetch(`http://localhost:8000/api/admin/staff/${id}`, { method: 'DELETE' });
      fetchStaff();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-[#141414] border border-gray-800 rounded-xl hover:bg-[#f97316] transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Staff Permissions</h1>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-[#f97316] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-400 transition-all shadow-lg"
        >
          <UserPlus size={20} /> Add Staff
        </button>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s) => (
          <div key={s.id} className="bg-[#141414] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between hover:border-[#f97316]/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#f97316]/10 rounded-2xl">
                <Users className="text-[#f97316]" size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* RE-VERIFIED DEVELOPER CHECK */}
                {currentUserRole === "Developer" && (
                   <button 
                    onClick={() => resetStaffPin(s.id, s.name)} 
                    className="text-gray-500 hover:text-blue-500 transition-colors p-1" 
                    title="Change PIN"
                   >
                     <RotateCcw size={20} />
                   </button>
                )}
                <button 
                  onClick={() => deleteStaff(s.id)} 
                  className="text-gray-600 hover:text-red-500 transition-colors p-1" 
                  title="Delete Staff"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">{s.name}</h3>
              <p className="text-gray-500 text-sm">@{s.username}</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                s.role === 'Admin' || s.role === 'Manager' ? 'bg-red-950/30 text-red-500' : 'bg-blue-950/30 text-blue-500'
              }`}>
                {s.role}
              </span>
              <div className="flex items-center gap-1 text-gray-500 text-sm font-mono">
                <Key size={14} /> {s.pin}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* ADD STAFF OVERLAY */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#141414] h-full p-8 border-l border-red-900/30 animate-in slide-in-from-right overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-[#f97316]" /> New Team Member</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input required type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                <input required type="text" value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                  <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none">
                    <option>Admin</option><option>Chef</option><option>Waiter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Login PIN</label>
                  <input required type="text" maxLength={4} value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#f97316] text-black py-4 rounded-xl font-bold mt-8 flex items-center justify-center gap-2 hover:bg-orange-400">
                <ShieldCheck size={20} /> Grant Permissions
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}