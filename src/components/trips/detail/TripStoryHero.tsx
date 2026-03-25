"use client";

import { ArrowLeft, Calendar, Camera, MapPin, Route } from "lucide-react";
import { useEffect, useRef } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface HeroStat {
  label: string;
  value: string;
}

interface TripStoryHeroProps {
  title: string;
  description: string;
  imageUrl: string;
  dateRangeLabel: string;
  creatorLabel: string;
  locationSummary: string;
  stats: HeroStat[];
  onBack: () => void;
}

function findScrollableParent(start: HTMLElement | null): HTMLElement | Window {
  let node = start?.parentElement ?? null;

  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScroll = overflowY === "auto" || overflowY === "scroll";

    if (canScroll && node.scrollHeight > node.clientHeight) {
      return node;
    }

    node = node.parentElement;
  }

  return window;
}

export default function TripStoryHero({
  title,
  description,
  imageUrl,
  dateRangeLabel,
  creatorLabel,
  locationSummary,
  stats,
  onBack,
}: TripStoryHeroProps) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const parallaxLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const parallaxLayer = parallaxLayerRef.current;

    if (!wrapper || !parallaxLayer) {
      return;
    }

    const scrollParent = findScrollableParent(wrapper);
    let animationFrame = 0;

    const updateParallax = () => {
      const { top } = wrapper.getBoundingClientRect();
      const translateY = Math.max(-28, Math.min(32, -top * 0.12));
      parallaxLayer.style.transform = `scale(1.09) translate3d(0, ${translateY}px, 0)`;
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();

    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(animationFrame);
      scrollParent.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [imageUrl]);

  return (
    <section
      ref={wrapperRef}
      className="relative isolate overflow-hidden rounded-[2rem] border border-white/45 bg-gradient-to-br from-slate-900 via-[#19324f] to-[#0b6d73] shadow-[0_26px_46px_-30px_rgba(13,28,58,0.95)]"
    >
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white backdrop-blur-lg transition hover:bg-black/40"
        aria-label="Back to trips"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
          
      <div ref={parallaxLayerRef} className="absolute inset-0 will-change-transform">
        <OptimizedImage
          src={imageUrl}
          alt={title}
          fill
          priority
          enableRetry
          showSkeleton
          skeletonClassName="bg-slate-300/40 animate-pulse"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 960px"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-[#041427]/90" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 flex min-h-[420px] flex-col justify-end gap-6 px-5 pb-6 pt-16 sm:px-7">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-100/95">
            <Route className="h-3.5 w-3.5" />
            Travel story
          </p>
          <h1 className="max-w-[22ch] text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-[48ch] text-sm leading-relaxed text-slate-200/95 sm:text-base">{description}</p>
          ) : null}
        </div>

        <div className="grid gap-2 text-xs text-slate-100/90 sm:grid-cols-3 sm:text-sm">
          <p className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-lg">
            <Calendar className="h-4 w-4" />
            {dateRangeLabel}
          </p>
          <p className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-lg">
            <MapPin className="h-4 w-4" />
            {locationSummary}
          </p>
          <p className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 backdrop-blur-lg">
            <Camera className="h-4 w-4" />
            {creatorLabel}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/30 bg-white/15 p-2 backdrop-blur-lg">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 px-3 py-2">
              <p className="text-lg font-semibold text-white sm:text-xl">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-200/90">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
