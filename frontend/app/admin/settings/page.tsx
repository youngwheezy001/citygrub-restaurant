"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Save, Building2, Smartphone, Receipt, Utensils, Globe, Loader2 } from "lucide-react";

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    restaurant_name: "CityGrub",
    mpesa_till: "",
    vat_percentage: 16,
    total_tables: 15,
    is_accepting_orders: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings on load
  useEffect(() => {
    // fetch('/api/admin/settings')... logic here
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-[#141414] border border-gray-800 rounded-xl hover:bg-[#f97316]">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black">System Settings</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#f97316] text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-400"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save Changes
        </button>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="flex flex-col gap-2">
          {[
            { id: 'general', label: 'General', icon: Building2 },
            { id: 'payments', label: 'Payments', icon: Smartphone },
            { id: 'tax', label: 'Tax & Fees', icon: Receipt },
            { id: 'operations', label: 'Operations', icon: Utensils },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? "bg-[#f97316] text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="md:col-span-3 bg-[#141414] border border-gray-800 rounded-[2rem] p-8">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Restaurant Branding</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Restaurant Name</label>
                <input 
                  type="text" 
                  value={settings.restaurant_name} 
                  onChange={(e) => setSettings({...settings, restaurant_name: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 outline-none focus:ring-1 focus:ring-[#f97316]"
                />
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">M-Pesa Configuration</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Buy Goods Till / Paybill</label>
                <input 
                  type="text" 
                  placeholder="e.g. 542222"
                  value={settings.mpesa_till}
                  onChange={(e) => setSettings({...settings, mpesa_till: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 outline-none focus:ring-1 focus:ring-[#f97316]"
                />
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Accounting Rules</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">VAT Percentage (%)</label>
                <input 
                  type="number" 
                  value={settings.vat_percentage}
                  onChange={(e) => setSettings({...settings, vat_percentage: parseFloat(e.target.value)})}
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 outline-none focus:ring-1 focus:ring-[#f97316]"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}