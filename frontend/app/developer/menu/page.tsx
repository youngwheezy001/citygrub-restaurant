"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, Search, Plus, X, Pizza, UploadCloud, ImageIcon, Edit3, Trash2, PowerOff } from "lucide-react";
import Cropper from "react-easy-crop";

// --- HELPER FUNCTIONS FOR CROPPING ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<{ file: File; url: string }>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "cropped_image.jpg", { type: "image/jpeg", lastModified: Date.now() });
      resolve({ file, url: URL.createObjectURL(blob) });
    }, "image/jpeg");
  });
};
// -------------------------------------

export default function DeveloperMenuEditor() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter(); 
  
  // --- NEW: Authorization State ---
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "General", description: "" });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

  useEffect(() => { 
    // --- ROBUST CLIENT-SIDE SECURITY PASS ---
    const role = localStorage.getItem("userRole");
    
    if (!role || (role !== "Admin" && role !== "Developer")) {
      alert("Unauthorized Access. Developer or Admin privileges required.");
      router.push("/login");
      return;
    }
    
    // If authorized, unlock the screen and fetch data
    setIsAuthorized(true);
    fetchMenu(); 
  }, [router]);

  // --- NEW: SECURE LOGOUT HANDLER ---
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    document.cookie = "citygrub_staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempImage(URL.createObjectURL(file));
      setShowCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
    e.target.value = ''; 
  };

  const handleCropConfirm = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(tempImage, croppedAreaPixels);
      if (cropped) {
        setSelectedFile(cropped.file);
        setPreview(cropped.url);
        setShowCropper(false);
        setTempImage(null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to crop image.");
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setNewItem({ name: "", price: "", category: "General", description: "" });
    setPreview(null);
    setSelectedFile(null);
    setShowAddForm(true);
  };

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newItem.name);
    formData.append("price", newItem.price);
    formData.append("category", newItem.category);
    formData.append("description", newItem.description);
    if (selectedFile) formData.append("image", selectedFile);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu`;

    try {
      const res = await fetch(url, { method: method, body: formData });
      if (res.ok) {
        setShowAddForm(false);
        fetchMenu();
      }
    } catch (err) { alert("Server connection failed."); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete ${name}?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchMenu();
    } catch (err) { alert("Delete failed"); }
  };

  const toggleAvailability = async (item: any) => {
    const formData = new FormData();
    formData.append("is_available", (!item.is_available).toString());
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/menu/${item.id}`, {
        method: "PATCH",
        body: formData
      });
      if (res.ok) fetchMenu();
    } catch (err) { console.error("Toggle failed"); }
  };

  const filteredItems = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- PREVENT RENDER IF NOT AUTHORIZED ---
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      
      {/* --- CROPPER FULLSCREEN OVERLAY --- */}
      {showCropper && tempImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full flex justify-between items-center max-w-3xl mb-4">
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2"><ImageIcon /> Move & Scale to Fit</h2>
            <button onClick={() => setShowCropper(false)} className="text-gray-500 hover:text-white"><X size={28} /></button>
          </div>
          
          <div className="relative w-full max-w-3xl h-[50vh] md:h-[60vh] bg-black border border-gray-800 rounded-xl overflow-hidden">
            <Cropper
              image={tempImage}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9} 
              onCropChange={setCrop}
              onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="mt-6 flex flex-col items-center w-full max-w-md gap-4">
            <label className="text-gray-400 text-sm font-bold">Zoom Level</label>
            <input 
              type="range" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>
          
          <div className="mt-8 flex gap-4 w-full max-w-3xl justify-end">
            <button onClick={() => setShowCropper(false)} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all">
              Cancel
            </button>
            <button onClick={handleCropConfirm} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all flex items-center gap-2">
              <Save size={20} /> Apply Crop & Finish
            </button>
          </div>
        </div>
      )}

      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          {/* --- UPDATED: WIRED UP LOGOUT BUTTON --- */}
          <button 
            onClick={handleLogout} 
            className="p-3 bg-red-950/30 text-red-500 rounded-xl border border-red-900/50 hover:bg-red-900/50 transition-colors"
            title="Secure Logout"
          >
            <PowerOff size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-500">Developer Menu Control</h1>
            <p className="text-gray-500 text-sm">SuperAdmin Access: Create, Edit, Disable, or Delete</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" placeholder="Search menu..."
              className="bg-[#141414] border border-gray-800 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-red-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={openAddForm} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 transition-all">
            <Plus size={20} /> Add Item
          </button>
        </div>
      </header>

      {/* ... Rest of your UI remains completely unchanged (showAddForm & filteredItems mapping) ... */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#141414] h-full p-8 border-l border-red-900/30 animate-in slide-in-from-right overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-red-500"><Pizza /> {editingId ? "Edit Dish" : "New Dish"}</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Food Photo (Will be cropped 16:9)</label>
                <div onClick={() => document.getElementById('fileInput')?.click()} className="mt-1 border-2 border-dashed border-gray-800 rounded-xl h-40 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-red-500">
                  {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-gray-500"><UploadCloud size={32} /><p className="text-xs mt-2 font-medium">Click to upload & crop</p></div>}
                  <input id="fileInput" type="file" hidden accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Dish Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-red-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (KES)</label>
                  <input required type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-red-500 outline-none">
                    <option>Breakfast</option>
                    <option>Snacks</option>
                    <option>Mains</option>
                    <option>Signature Meals</option>
                    <option>Indian Corner</option>
                    <option>Sizzling Meals</option>
                    <option>Sides</option>
                    <option>Juices</option>
                    <option>Tea</option>
                    <option>Drinks</option>
                    <option>General</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:ring-1 focus:ring-red-500 outline-none min-h-[100px]" />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold mt-8 flex items-center justify-center gap-2 hover:bg-red-500">
                <Save size={20} /> {editingId ? "Update Item" : "Save to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-red-500" size={48} /></div>
        ) : filteredItems.map((item) => (
          <div key={item.id} className={`bg-[#141414] border rounded-2xl overflow-hidden flex flex-col relative group transition-all ${item.is_available === false ? 'border-red-900/50 opacity-60 grayscale' : 'border-gray-800'}`}>
            
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => toggleAvailability(item)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg backdrop-blur-md transition-colors ${item.is_available !== false ? 'bg-black/70 text-green-400 hover:bg-green-900/50' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                 {item.is_available !== false ? '✅ Active' : '❌ Sold Out'}
               </button>

               <div className="flex gap-2">
                 <button onClick={() => openEditForm(item)} className="bg-black/70 p-2 rounded-lg text-white hover:text-blue-400 backdrop-blur-sm">
                   <Edit3 size={18} />
                 </button>
                 <button onClick={() => handleDelete(item.id, item.name)} className="bg-black/70 p-2 rounded-lg text-white hover:text-red-500 backdrop-blur-sm">
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>

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
                <span className="text-gray-400 font-mono font-bold whitespace-nowrap">KES {item.price}</span>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
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