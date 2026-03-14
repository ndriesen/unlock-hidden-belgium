"use client";

import Image from 'next/image';
import Link from 'next/link';

import { Hotspot as HotspotType } from '@/types/hotspot';

interface HotspotGridProps {
  hotspots: Array<{
    id: string;
    name: string;
    province: string;
    image_url: string;
    visited_at: string;
  }>;
  title: string;
  limit?: number;
}

export function HotspotGrid({ hotspots, title, limit = 12 }: HotspotGridProps) {
  const displayHotspots = limit ? hotspots.slice(0, limit) : hotspots;

  if (displayHotspots.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          📍
        </div>
        <h3 className="text-lg font-semibold mb-2">No hotspots yet</h3>
        <p className="text-sm">Start exploring to discover hidden gems</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {title}
        <span className="text-sm text-slate-500 font-normal">({hotspots.length})</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayHotspots.map((hotspot) => (
          <Link
            key={hotspot.id}
            href={`/hotspots/${hotspot.id}`}
            className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-emerald-50">
              <Image
                src={hotspot.image_url}
                alt={hotspot.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                {hotspot.name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{hotspot.province}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(hotspot.visited_at).toLocaleDateString('nl-BE', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {hotspots.length > limit && (
        <div className="text-center pt-4">
          <Link href="#" className="text-sm text-emerald-600 hover:underline font-medium">
            Show all {hotspots.length} hotspots →
          </Link>
        </div>
      )}
    </div>
  );
}

