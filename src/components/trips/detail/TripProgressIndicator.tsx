"use client";

import { cn } from "@/lib/utils";

interface TripProgressIndicatorProps {
  activeIndex: number;
  totalStops: number;
  activeLabel: string;
}

export default function TripProgressIndicator({
  activeIndex,
  totalStops,
  activeLabel,
}: TripProgressIndicatorProps) {
  const safeTotal = Math.max(totalStops, 1);
  const safeActive = Math.max(0, Math.min(activeIndex, safeTotal - 1));
  const progress = ((safeActive + 1) / safeTotal) * 100;

  return (
    <div className="sticky top-0 z-30 rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-[0_12px_28px_-18px_rgba(11,19,36,0.75)] backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>Journey progress</span>
        <span>
          Stop {safeActive + 1}/{safeTotal}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0f766e] via-[#0f766e] to-[#0ea5a5] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className={cn("mt-2 truncate text-sm font-medium text-slate-800", safeTotal === 0 && "text-slate-500")}>
        {activeLabel}
      </p>
    </div>
  );
}
