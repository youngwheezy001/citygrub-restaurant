import { UtensilsCrossed } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center min-h-screen">
      <div className="relative flex flex-col items-center animate-pulse">
        {/* The glowing background behind the icon */}
        <div className="absolute inset-0 bg-[#f97316] blur-[60px] opacity-20 rounded-full h-32 w-32"></div>
        
        <div className="bg-[#141414] p-6 rounded-full border border-gray-800 shadow-2xl relative z-10">
          <UtensilsCrossed size={48} className="text-[#f97316]" />
        </div>
        
        <h2 className="text-2xl font-black text-white mt-6 tracking-widest uppercase">
          City<span className="text-[#f97316]">Grub</span>
        </h2>
        <p className="text-gray-500 text-sm mt-2 font-medium tracking-widest animate-pulse">
          PREPARING YOUR TABLE...
        </p>
      </div>
    </div>
  );
}