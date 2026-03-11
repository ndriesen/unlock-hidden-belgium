"use client";

import { motion } from "framer-motion";
import { MapPin, Heart, Bookmark, Share2, Star, ExternalLink } from "lucide-react";

interface Hotspot {
  id: string;
  name: string;
  city: string;
  province?: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  image_url?: string;
  rating?: number;
  saves_count?: number;
}

interface HotspotPreviewProps {
  hotspot: Hotspot;
  variant?: "compact" | "full";
  onSave?: () => void;
  onClick?: () => void;
  className?: string;
}

const CATEGORY_CONFIG = {
  nature: {
    icon: "🌲",
    color: "#22c55e",
    bgGradient: "from-green-500/20 to-emerald-500/10",
    label: "Nature"
  },
  food: {
    icon: "🍽️",
    color: "#f59e0b",
    bgGradient: "from-amber-500/20 to-orange-500/10",
    label: "Food & Drink"
  },
  urban: {
    icon: "🏙️",
    color: "#8b5cf6",
    bgGradient: "from-violet-500/20 to-purple-500/10",
    label: "Urban"
  },
  nightlife: {
    icon: "🌙",
    color: "#ec4899",
    bgGradient: "from-pink-500/20 to-rose-500/10",
    label: "Nightlife"
  },
  hidden: {
    icon: "💎",
    color: "#06b6d4",
    bgGradient: "from-cyan-500/20 to-sky-500/10",
    label: "Hidden Gem"
  },
  default: {
    icon: "📍",
    color: "#22c55e",
    bgGradient: "from-emerald-500/20 to-teal-500/10",
    label: "Hotspot"
  }
};

export default function HotspotPreview({ 
  hotspot, 
  variant = "compact",
  onSave,
  onClick,
  className = "" 
}: HotspotPreviewProps) {
  const config = CATEGORY_CONFIG[hotspot.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.default;

  if (variant === "full") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden ${className}`}
      >
        {/* Image/Header */}
        <div 
          className={`h-32 bg-gradient-to-br ${config.bgGradient} flex items-center justify-center relative`}
        >
          <span className="text-5xl">{config.icon}</span>
          
          {/* Category badge */}
          <div 
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: config.color }}
          >
            {config.label}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {hotspot.name}
            </h3>
            {hotspot.rating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{hotspot.rating}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4" />
            {hotspot.city}{hotspot.province && `, ${hotspot.province}`}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
            {hotspot.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            {hotspot.saves_count !== undefined && (
              <div className="flex items-center gap-1">
                <Bookmark className="w-4 h-4" />
                <span>{hotspot.saves_count} saves</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${config.color}30, ${config.color}10)` }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
            {hotspot.name}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {hotspot.city}
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bookmark className="w-5 h-5 text-slate-400 hover:text-emerald-500 transition-colors" />
        </button>
      </div>
    </motion.div>
  );
}

// Skeleton loader for hotspot preview
export function HotspotPreviewSkeleton({ variant = "compact" }: { variant?: "compact" | "full" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden animate-pulse ${variant === "full" ? "shadow-lg" : ""}`}>
      {variant === "full" ? (
        <>
          <div className="h-32 bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="flex gap-2 mt-4">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      )}
    </div>
  );
}

