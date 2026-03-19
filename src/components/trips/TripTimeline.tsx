"use client";

import { format } from "date-fns";
import Image from "next/image";
import { TripStop } from "@/types/trip";
import { Timeline } from "@/components/ui/timeline";
import React from "react";

interface TripTimelineProps {
  stops: TripStop[];
}

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export default function TripTimeline({ stops }: TripTimelineProps) {
  // Group stops by day from visitedAt dates
  const { useMemo } = React;
  const dayGroups = useMemo(() => {
    const groups: Record<string, TripStop[]> = {};
    
    stops.forEach((stop) => {
      if (stop.visitedAt) {
        const date = new Date(stop.visitedAt);
        const dayKey = format(date, "MMM dd, yyyy");
        if (!groups[dayKey]) {
          groups[dayKey] = [];
        }
        groups[dayKey].push(stop);
      }
    });

    // Sort days chronologically
    return Object.entries(groups).sort(([a], [b]) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [stops]);

  // Transform grouped data for Timeline component
  const timelineData: TimelineEntry[] = useMemo(() => {
    return dayGroups.map(([dayTitle, dayStops]) => ({
      title: dayTitle,
      content: (
        <div className="space-y-4">
          {dayStops.map((stop) => {
            const imgSrc = stop.media[0]?.signedUrl || 
                          stop.photoUrl || 
                          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop";
            
            return (
              <div key={stop.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex gap-4 items-start">
                  {/* Stop Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                    <Image 
                      src={imgSrc} 
                      alt={stop.name} 
                      fill 
                      className="object-cover" 
                      sizes="96px" 
                    />
                    {stop.media.length > 0 && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                        {stop.media.length}
                      </div>
                    )}
                  </div>

                  {/* Stop Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-slate-900 mb-1 leading-tight">
                      {stop.name}
                    </h4>
                    <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                        {stop.category}
                      </span>
                      <span>•</span>
                      <span>{stop.province}</span>
                    </p>
                    
                    {stop.note && (
                      <p className="text-sm text-slate-700 mb-3 italic bg-slate-50 p-3 rounded-xl border-l-4 border-emerald-400">
                        "{stop.note}"
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>📍 {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                      {stop.visitedAt && (
                        <span>
                          Visited {format(new Date(stop.visitedAt), "MMM dd")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
    }));
  }, [dayGroups]);

  if (stops.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
          📅
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No timeline yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Add visit dates to your stops in the Route tab to see your journey timeline.
        </p>
      </div>
    );
  }

  if (timelineData.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
          ⏳
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Planned stops</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Set visit dates on your stops to create your timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gradient-to-b from-slate-50 to-white rounded-3xl -mx-4 mb-8">
      <Timeline data={timelineData} />
    </div>
  );
}

