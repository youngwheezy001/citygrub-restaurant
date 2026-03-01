"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Save, Loader2, Search, UtensilsCrossed, Plus, X, Pizza, UploadCloud, ImageIcon, Edit3 } from "lucide-react";

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // --- New State for Editing ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "General", description: "" });
  
  // --- Image States ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu`);
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to load menu", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  // --- Handle Image Preview ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- Open Form for Adding ---
  const openAddForm = () => {
    setEditingId(null);
    setNewItem({ name: "", price: "", category: "General", description: "" });
    setPreview(null);
    setSelectedFile(null);
    setShowAddForm(true);
  };

  // --- Open Form for Editing ---
  const openEditForm = (item: any) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      price: item.price.toString(),
      category: item.category || "General",
      description: item.description || ""
    });
    setPreview(item.image_url || null);
    setSelectedFile(null);
    setShowAddForm(true);
  };

  // --- Submit Form (Handles both Add and Edit) ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", newItem.name);
    formData.append("price", newItem.price);
    formData.append("category", newItem.category);
    formData.append("description", newItem.description);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    // Decide if we are POSTing a new item or PATCHing an existing one
    const method = editingId ? "PATCH" : "POST";
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu`;

    try {
      const res = await fetch(url, {
        method: method,
        body: formData
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditingId(null);
        setNewItem({ name: "", price: "", category: "General", description: "" });
        setSelectedFile(null);
        setPreview(null);
        fetchMenu();
      } else {
        const errorData = await res.json();
        alert(`❌ Server Error: ${errorData.detail || 'Could not save item'}`);
      }
    } catch (err) { 
      alert("Failed to connect to the backend server."); 
    }
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-gray-900 rounded-lg hover:bg-[#f97316] hover:text-black transition-all">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Menu Manager</h1>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" placeholder="Search..."
              className="bg-[#141414] border border-gray-800 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-[#f97316]"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={openAddForm}
            className="bg-[#f97316] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-400 transition-all"
          >
            <Plus size={20} /> Add Item
          </button>
        </div>
      </header>

      {/* ADD/EDIT ITEM OVERLAY */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#141414] h-full p-8 border-l border-gray-800 animate-in slide-in-from-right transition-all overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Pizza className="text-[#f97316]" /> {editingId ? "Edit Dish" : "New Dish"}
              </h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-6">
              {/* Image Picker Section */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Food Photo</label>
                <div 
                  className="mt-1 border-2 border-dashed border-gray-800 rounded-xl h-40 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#f97316] transition-all"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 group-hover:text-[#f97316]">
                      <UploadCloud size={32} />
                      <p className="text-xs mt-2 font-medium">Click to upload photo</p>
                    </div>
                  )}
                  <input 
                    id="fileInput" 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Dish Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (KES)</label>
                  <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none">
                    <option>General</option>
                    <option>Breakfast</option>
                    <option>Snacks</option>
                    <option>Mains</option>
                    <option>Drinks</option>
                    <option>Signature Meals</option>
                    <option>Indian Corner</option>
                    <option>Sizzling Meals</option>
                    <option>Sides</option>
                    <option>Juices</option>
                    <option>Tea</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description (Optional)</label>
                <textarea 
                  value={newItem.description} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})} 
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-[#f97316] outline-none min-h-[100px]"
                />
              </div>

              <button type="submit" className="w-full bg-[#f97316] text-black py-4 rounded-xl font-bold mt-8 flex items-center justify-center gap-2 hover:bg-orange-400">
                <Save size={20} /> {editingId ? "Update Item" : "Save to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MENU GRID */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden flex flex-col relative group">
            
            {/* The Edit Button overlay - appears on hover */}
            <button 
              onClick={() => openEditForm(item)}
              className="absolute top-3 right-3 z-10 bg-black/70 p-2 rounded-lg text-white hover:text-[#f97316] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 size={18} />
            </button>

            {/* Image Banner */}
            {item.image_url ? (
               <div className="h-48 w-full bg-black border-b border-gray-800 relative">
                 <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
               </div>
            ) : (
               <div className="h-48 w-full bg-gray-900 border-b border-gray-800 flex items-center justify-center text-gray-700">
                 <ImageIcon size={48} />
               </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl pr-8">{item.name}</h3>
                <span className="text-[#f97316] font-mono font-bold whitespace-nowrap">KES {item.price}</span>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description || "No description provided."}</p>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-600 bg-black/40 px-3 py-1 rounded w-fit">
                {item.category}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}