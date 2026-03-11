"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, MapPin, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getTopHotspots, HotspotRanking } from "@/lib/services/ranking";

// Extended hotspot interface with ranking data
interface Hotspot {
  id: string;
  name: string;
  city?: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  images?: string[];
  tags?: string[];
  savesCount?: number;
  viewsCount?: number;
  tripVisitsCount?: number;
  province?: string;
  createdAt?: string;
  scores?: {
    overall: number;
    popularity: number;
    recency: number;
    quality: number;
    tripUsage: number;
    social: number;
  };
}

interface GlobeHeroProps {
  onHotspotClick?: (hotspot: Hotspot) => void;
  onSaveHotspot?: (hotspot: Hotspot) => void;
  showPreview?: boolean;
  className?: string;
}

// Convert ranking data to Hotspot format
function convertRankingToHotspot(ranking: HotspotRanking): Hotspot {
  return {
    id: ranking.hotspot_id,
    name: ranking.hotspot_name,
    lat: ranking.latitude,
    lng: ranking.longitude,
    category: ranking.category,
    province: ranking.province,
    description: ranking.description || '',
    images: ranking.images || [],
    tags: ranking.tags || [],
    savesCount: ranking.saves_count,
    viewsCount: ranking.views_count,
    tripVisitsCount: ranking.trip_visits_count,
    createdAt: ranking.created_at,
    city: ranking.province,
    scores: {
      overall: ranking.ranking_score,
      popularity: ranking.popularity_score,
      recency: ranking.recency_score,
      quality: ranking.quality_score,
      tripUsage: ranking.trip_usage_score,
      social: ranking.social_score,
    },
  };
}

// Default fallback hotspots when API is not available
const FALLBACK_HOTSPOTS: Hotspot[] = [
  {
    id: "fallback-1",
    name: "Hidden Jazz Bar",
    city: "Brussels",
    lat: 50.8503,
    lng: 4.3517,
    category: "nightlife",
    description: "A secret jazz cellar in the heart of Brussels"
  },
  {
    id: "fallback-2",
    name: "Forest Waterfall",
    city: "Ardennes",
    lat: 50.0833,
    lng: 5.8667,
    category: "nature",
    description: "A hidden waterfall deep in the Ardennes forest"
  },
  {
    id: "fallback-3",
    name: "Street Art Alley",
    city: "Ghent",
    lat: 51.0543,
    lng: 3.7174,
    category: "urban",
    description: "The most colorful street art in Belgium"
  },
  {
    id: "fallback-4",
    name: "Local Food Market",
    city: "Antwerp",
    lat: 51.2194,
    lng: 4.4025,
    category: "food",
    description: "A hidden gem for local delicacies"
  },
  {
    id: "fallback-5",
    name: "Medieval Castle",
    city: "Dinant",
    lat: 50.2619,
    lng: 4.9130,
    category: "hidden",
    description: "A lesser-known medieval fortress"
  },
];

export default function GlobeHero({ 
  onHotspotClick, 
  onSaveHotspot,
  showPreview = true,
  className = "" 
}: GlobeHeroProps) {
  const [rotation, setRotation] = useState({ x: 20, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hotspots, setHotspots] = useState<Hotspot[]>(FALLBACK_HOTSPOTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch ranked hotspots on mount
  useEffect(() => {
    async function fetchHotspots() {
      try {
        setIsLoading(true);
        const rankings = await getTopHotspots(20);
        if (rankings && rankings.length > 0) {
          const convertedHotspots = rankings.map(convertRankingToHotspot);
          setHotspots(convertedHotspots);
        }
      } catch (err) {
        console.error('Error fetching ranked hotspots:', err);
        setError('Failed to load hotspots');
        // Keep using fallback hotspots
      } finally {
        setIsLoading(false);
      }
    }

    fetchHotspots();
  }, []);

  // Auto-rotate when not dragging
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setRotation(prev => ({ ...prev, y: prev.y + 0.3 }));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    setRotation(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.2)),
      y: prev.y + deltaX * 0.3
    }));
    setStartPos({ x: e.clientX, y: e.clientY });
  }, [isDragging, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleHotspotClick = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    onHotspotClick?.(hotspot);
  };

  const handleSaveHotspot = (hotspot: Hotspot) => {
    onSaveHotspot?.(hotspot);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % hotspots.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + hotspots.length) % hotspots.length);
  };

  // Convert lat/lng to 3D position on sphere
  const latLngTo3D = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return {
      x: -radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  };

  // Get hotspot position based on current rotation
  const getHotspotPosition = (hotspot: Hotspot, radius: number) => {
    const pos = latLngTo3D(hotspot.lat, hotspot.lng, radius);
    // Apply rotation
    const radX = rotation.x * (Math.PI / 180);
    const radY = rotation.y * (Math.PI / 180);
    
    // Rotate around X axis
    let y = pos.y * Math.cos(radX) - pos.z * Math.sin(radX);
    let z = pos.y * Math.sin(radX) + pos.z * Math.cos(radX);
    
    // Rotate around Y axis
    const x = pos.x * Math.cos(radY) + z * Math.sin(radY);
    z = -pos.x * Math.sin(radY) + z * Math.cos(radY);
    
    return { x, y, z };
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nature: "#22c55e",
      food: "#f59e0b",
      urban: "#8b5cf6",
      nightlife: "#ec4899",
      hidden: "#06b6d4"
    };
    return colors[category] || "#22c55e";
  };

  const radius = 140;

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`} ref={containerRef}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl overflow-hidden">
        {/* Star field */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3
              }}
            />
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Globe container */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Globe sphere */}
          <div 
            className="relative"
            style={{ 
              width: radius * 2, 
              height: radius * 2,
              perspective: "1000px"
            }}
          >
            {/* Globe background */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, #1e3a5f 0%, #0f172a 60%, #0a1628 100%)",
                boxShadow: "inset -20px -20px 60px rgba(0,0,0,0.5), inset 20px 20px 60px rgba(30,58,95,0.3)"
              }}
            />

            {/* Globe grid lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Latitude lines */}
              {[20, 40, 60, 80].map((lat, i) => (
                <ellipse
                  key={`lat-${i}`}
                  cx="50"
                  cy="50"
                  rx="48"
                  ry={48 * Math.cos((lat - 50) * Math.PI / 50)}
                  fill="none"
                  stroke="rgba(34, 197, 94, 0.15)"
                  strokeWidth="0.3"
                  transform={`rotate(${rotation.y} 50 50)`}
                />
              ))}
              {/* Longitude lines */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((lng, i) => (
                <line
                  key={`lng-${i}`}
                  x1="50"
                  y1="2"
                  x2="50"
                  y2="98"
                  stroke="rgba(34, 197, 94, 0.1)"
                  strokeWidth="0.3"
                  transform={`rotate(${lng + rotation.y} 50 50)`}
                />
              ))}
            </svg>

            {/* Hotspots */}
            {hotspots.map((hotspot) => {
              const pos = getHotspotPosition(hotspot, radius);
              const isVisible = pos.z > -50; // Only show on front side
              const isHovered = hoveredHotspot?.id === hotspot.id;
              
              if (!isVisible) return null;

              return (
                <motion.button
                  key={hotspot.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: isHovered ? 1.3 : 1, 
                    opacity: 1 
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute z-20"
                  style={{
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: "translate(-50%, -50%)"
                  }}
                  onMouseEnter={() => setHoveredHotspot(hotspot)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  onClick={() => handleHotspotClick(hotspot)}
                >
                  <div 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${isHovered ? 'shadow-lg' : ''}`}
                    style={{
                      backgroundColor: getCategoryColor(hotspot.category),
                      boxShadow: `0 0 20px ${getCategoryColor(hotspot.category)}80`
                    }}
                  >
                    {/* Pulse effect */}
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        backgroundColor: getCategoryColor(hotspot.category),
                        opacity: 0.6
                      }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm flex items-center gap-2">
          <Compass className="w-4 h-4" />
          Drag to explore
        </div>

        {/* Category legend */}
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-xl p-3">
          <div className="space-y-2">
            {[
              { category: "nature", label: "Nature" },
              { category: "food", label: "Food" },
              { category: "urban", label: "Urban" },
              { category: "nightlife", label: "Nightlife" },
              { category: "hidden", label: "Hidden Gems" }
            ].map(({ category, label }) => (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <span className="text-xs text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotspot Preview Card */}
      <AnimatePresence>
        {(hoveredHotspot || selectedHotspot) && showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-30"
          >
            {selectedHotspot ? (
              <SelectedHotspotCard 
                hotspot={selectedHotspot} 
                onClose={() => setSelectedHotspot(null)}
                onSave={() => handleSaveHotspot(selectedHotspot)}
              />
            ) : hoveredHotspot ? (
              <PreviewHotspotCard 
                hotspot={hoveredHotspot} 
                onClick={() => handleHotspotClick(hoveredHotspot)}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel for mobile */}
      <div className="absolute bottom-4 left-0 right-0 md:hidden flex items-center justify-center gap-2 z-20">
        <button 
          onClick={prevSlide}
          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white/80 text-sm">
          {currentSlide + 1} / {hotspots.length}
        </span>
        <button 
          onClick={nextSlide}
          className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Preview Card Component
function PreviewHotspotCard({ hotspot, onClick }: { hotspot: Hotspot; onClick: () => void }) {
  return (
    <div 
      className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ 
            backgroundColor: `${getCategoryColor(hotspot.category)}20`
          }}
        >
          {hotspot.category === "nature" && "🌲"}
          {hotspot.category === "food" && "🍽️"}
          {hotspot.category === "urban" && "🏙️"}
          {hotspot.category === "nightlife" && "🌙"}
          {hotspot.category === "hidden" && "💎"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
            {hotspot.name}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {hotspot.city || hotspot.province}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {hotspot.description}
          </p>
          {hotspot.scores && (
            <p className="text-xs text-emerald-500 mt-1">
              Score: {hotspot.scores.overall.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Selected Card Component
function SelectedHotspotCard({ 
  hotspot, 
  onClose, 
  onSave 
}: { 
  hotspot: Hotspot; 
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="p-4">
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
      
      <div 
        className="w-full h-32 rounded-xl mb-3 flex items-center justify-center text-4xl"
        style={{ 
          background: `linear-gradient(135deg, ${getCategoryColor(hotspot.category)}40, ${getCategoryColor(hotspot.category)}10)`
        }}
      >
        {hotspot.category === "nature" && "🌲"}
        {hotspot.category === "food" && "🍽️"}
        {hotspot.category === "urban" && "🏙️"}
        {hotspot.category === "nightlife" && "🌙"}
        {hotspot.category === "hidden" && "💎"}
      </div>
      
      <h4 className="font-bold text-lg text-slate-900 dark:text-white">
        {hotspot.name}
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
        <MapPin className="w-3 h-3" />
        {hotspot.city || hotspot.province}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        {hotspot.description}
      </p>
      
      {hotspot.scores && (
        <div className="mb-4 text-xs text-slate-500">
          <div className="grid grid-cols-2 gap-2">
            <div>Popularity: {hotspot.scores.popularity.toFixed(2)}</div>
            <div>Recency: {hotspot.scores.recency.toFixed(2)}</div>
            <div>Quality: {hotspot.scores.quality.toFixed(2)}</div>
            <div>Trip Usage: {hotspot.scores.tripUsage.toFixed(2)}</div>
          </div>
        </div>
      )}
      
      <button
        onClick={onSave}
        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all"
      >
        Save to Favorites
      </button>
    </div>
  );
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    nature: "#22c55e",
    food: "#f59e0b",
    urban: "#8b5cf6",
    nightlife: "#ec4899",
    hidden: "#06b6d4"
  };
  return colors[category] || "#22c55e";
}

