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
  Sparkles,
  Mountain,
} from "lucide-react";

interface CategoryExplorerProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[];
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const defaultCategoryIds = [
  "Nature",
  "Bars",
  "Castles",
  "Waterfalls",
  "Viewpoints",
  "Food",
  "Culture",
  "Sunset",
];

function getCategoryTheme(category: string): Pick<Category, "icon" | "color"> {
  const key = category.toLowerCase();

  if (key.includes("nature") || key.includes("forest") || key.includes("park")) {
    return { icon: Trees, color: "bg-emerald-500" };
  }
  if (key.includes("bar") || key.includes("night") || key.includes("drink")) {
    return { icon: GlassWater, color: "bg-amber-500" };
  }
  if (key.includes("castle") || key.includes("fort") || key.includes("abbey")) {
    return { icon: Castle, color: "bg-purple-500" };
  }
  if (key.includes("water") || key.includes("fall") || key.includes("river")) {
    return { icon: Mountain, color: "bg-cyan-500" };
  }
  if (key.includes("view") || key.includes("lookout") || key.includes("photo")) {
    return { icon: Compass, color: "bg-blue-500" };
  }
  if (key.includes("food") || key.includes("eat") || key.includes("restaurant")) {
    return { icon: UtensilsCrossed, color: "bg-orange-500" };
  }
  if (key.includes("culture") || key.includes("museum") || key.includes("art")) {
    return { icon: Landmark, color: "bg-rose-500" };
  }
  if (key.includes("sun") || key.includes("sunset")) {
    return { icon: Sun, color: "bg-gradient-to-r from-orange-500 to-pink-500" };
  }

  return { icon: Sparkles, color: "bg-emerald-500" };
}

export default function CategoryExplorer({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryExplorerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const resolvedCategories: Category[] = (categories && categories.length ? categories : defaultCategoryIds).map(
    (categoryId) => {
      const theme = getCategoryTheme(categoryId);
      return {
        id: categoryId,
        label: categoryId,
        icon: theme.icon,
        color: theme.color,
      };
    }
  );

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
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
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={checkScroll}
      >
        {resolvedCategories.map((category) => {
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
                  ? `${category.color} text-white shadow-lg shadow-${category.color.split(" ")[1] || "emerald"}/25`
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md"
                }
                active:scale-[0.97]
              `}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
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
