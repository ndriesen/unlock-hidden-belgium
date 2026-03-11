"use client";

interface SkeletonCardProps {
  variant?: "hotspot" | "activity" | "compact";
}

export default function SkeletonCard({ variant = "hotspot" }: SkeletonCardProps) {
  if (variant === "activity") {
    return (
      <div className="flex items-start gap-3 p-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-slate-200 p-3 space-y-2 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  // Hotspot card variant (default)
  return (
    <div className="flex-shrink-0 w-[260px] md:w-[280px] animate-pulse">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Image skeleton */}
        <div className="relative h-40 md:h-44 bg-slate-200">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
        </div>
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// Horizontal scroll skeleton container
export function SkeletonCardRow({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} variant="hotspot" />
      ))}
    </div>
  );
}

// Section skeleton with header
export function SkeletonSection() {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-40" />
            <div className="h-4 bg-slate-200 rounded w-60" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>

        {/* Cards */}
        <SkeletonCardRow count={4} />
      </div>
    </section>
  );
}

