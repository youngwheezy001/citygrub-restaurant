"use client";

import { Pizza, Beef, Drumstick, Coffee, IceCream, Leaf } from "lucide-react";

// Our dynamic array of food categories
const categories = [
  { name: "Pizzas", icon: Pizza, id: 1 },
  { name: "Burgers", icon: Beef, id: 2 },
  { name: "Chicken", icon: Drumstick, id: 3 },
  { name: "Drinks", icon: Coffee, id: 4 },
  { name: "Desserts", icon: IceCream, id: 5 },
  { name: "Vegan", icon: Leaf, id: 6 },
];

export default function CategorySlider() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <h2 className="text-2xl font-bold text-brand-text tracking-tight mb-6">
        What are you craving?
      </h2>

      {/* Horizontal Scroll Container 
        - snap-x & snap-mandatory create the "magnetic" swipe feel
        - The bracket classes hide the scrollbar across all major browsers
      */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          // We set the first item to "active" so you can see the brand styling
          const isActive = index === 0; 

          return (
            <button
              key={cat.id}
              className={`snap-start shrink-0 flex flex-col items-center justify-center gap-3 w-28 h-28 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105"
                  : "bg-brand-surface border-white/5 text-brand-muted hover:border-brand-orange/50 hover:text-brand-text"
              }`}
            >
              <Icon size={32} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-sm">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}