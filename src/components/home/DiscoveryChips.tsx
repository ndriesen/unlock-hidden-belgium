"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { 
  Compass, 
  Trees, 
  GlassWater, 
  Castle, 
  Sun, 
  UtensilsCrossed, 
  Landmark, 
  Zap,
  Sparkles,
  Mountain
} from "lucide-react";

interface CategoryExplorerProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: Category[] = [
  { id: "Nature", label: "🏔 Nature", icon: Trees, color: "bg-emerald-500" },
  { id: "Bars", label: "🍻 Bars", icon: GlassWater, color: "bg-amber-500" },
  { id: "Castles", label: "🏰 Castles", icon: Castle, color: "bg-purple-500" },
  { id: "Waterfalls", label: "🌊 Waterfalls", icon: Mountain, color: "bg-cyan-500" },
  { id: "Viewpoints", label: "📸 Viewpoints", icon: Compass, color: "bg-blue-500" },
  { id: "Food", label: "🍴 Food", icon: UtensilsCrossed, color: "bg-orange-500" },
  { id: "Culture", label: "🏛 Culture", icon: Landmark, color: "bg-rose-500" },
  { id: "Sunset", label: "🌅 Sunset Spots", icon: Sun, color: "bg-gradient-to-r from-orange-500 to-pink-500" },
];

export default function CategoryExplorer({ 
  selectedCategory, 
  onCategoryChange 
}: CategoryExplorerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div className="relative">
      {/* Left Fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkScroll}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-200 ease-out
                flex-shrink-0
                ${isSelected 
                  ? `${category.color} text-white shadow-lg shadow-${category.color.split(' ')[1] || 'emerald'}/25` 
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
                }
                active:scale-[0.97]
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Right Fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}
    </div>
  );
}

