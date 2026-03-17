"use client";

import { useState } from 'react';
import { Hotspot } from '@/types/hotspot';
import HotspotCard from '@/components/ui/HotspotCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FloatingHotspotListProps {
  hotspots: Hotspot[];
  title: string;
  subtitle?: string;
  className?: string;
}

export default function FloatingHotspotList({
  hotspots,
  title,
  subtitle,
  className = ''
}: FloatingHotspotListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden max-w-2xl mx-auto mb-8 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all"
            aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div className={`overflow-y-auto max-h-96 transition-all ${isExpanded ? 'max-h-96 py-4' : 'max-h-0 py-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
          {hotspots.slice(0, 8).map((hotspot) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={{
                ...hotspot,
                images: hotspot.images || [],
                category: typeof hotspot.category === 'string' 
                  ? hotspot.category 
                  : hotspot.category.name || "Unknown"
              }}
              className="h-64 shadow-lg hover:shadow-xl transition-all group"
            />
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
        {hotspots.length}+ gems
      </div>
    </div>
  );
}

