"use client";

import Link from "next/link";
import { ArrowUpRight, Camera, Clock3, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

export interface JourneyStopItem {
  id: string;
  hotspotId: string;
  order: number;
  name: string;
  categoryLabel: string;
  province: string;
  note: string;
  imageUrl: string;
  mediaPreviewUrls?: string[];
  visitedLabel: string;
  visitedAt: string | null;
  mediaCount: number;
  distanceFromPreviousKm: number | null;
}

export interface JourneyGroup {
  key: string;
  title: string;
  subtitle: string;
  stops: JourneyStopItem[];
}

interface JourneyTimelineProps {
  groups: JourneyGroup[];
  activeStopId: string | null;
  onActiveStopChange?: (stopId: string) => void;
  onAddMemory?: (stop: JourneyStopItem) => void;
  onImageClick?: (stop: JourneyStopItem, imageUrl?: string) => void;
}

function buildPreviewUrls(stop: JourneyStopItem): string[] {
  const ordered = [stop.imageUrl, ...(stop.mediaPreviewUrls ?? [])].filter(Boolean);
  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const url of ordered) {
    if (!seen.has(url)) {
      seen.add(url);
      uniqueUrls.push(url);
    }
  }

  return uniqueUrls;
}

export default function JourneyTimeline({
  groups,
  activeStopId,
  onActiveStopChange,
  onAddMemory,
  onImageClick,
}: JourneyTimelineProps) {
  const [revealedStopIds, setRevealedStopIds] = useState<string[]>([]);
  const stopRefs = useRef(new Map<string, HTMLElement>());
  const visibilityRatiosRef = useRef(new Map<string, number>());

  const allStops = useMemo(() => groups.flatMap((group) => group.stops), [groups]);
  const revealedStopSet = useMemo(() => new Set(revealedStopIds), [revealedStopIds]);

  const setStopRef = useCallback(
    (stopId: string) => (node: HTMLElement | null) => {
      if (!node) {
        stopRefs.current.delete(stopId);
        return;
      }

      stopRefs.current.set(stopId, node);
    },
    []
  );

  useEffect(() => {
    if (!allStops.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: string[] = [];

        for (const entry of entries) {
          const stopId = (entry.target as HTMLElement).dataset.stopId;
          if (!stopId) {
            continue;
          }

          if (entry.isIntersecting) {
            newlyVisible.push(stopId);
            visibilityRatiosRef.current.set(stopId, entry.intersectionRatio);
          } else {
            visibilityRatiosRef.current.delete(stopId);
          }
        }

        if (newlyVisible.length) {
          setRevealedStopIds((previous) => {
            const next = new Set(previous);
            let changed = false;

            for (const stopId of newlyVisible) {
              if (!next.has(stopId)) {
                next.add(stopId);
                changed = true;
              }
            }

            return changed ? Array.from(next) : previous;
          });
        }

        if (onActiveStopChange) {
          let bestStopId: string | null = null;
          let bestRatio = -1;

          visibilityRatiosRef.current.forEach((ratio, stopId) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestStopId = stopId;
            }
          });

          if (bestStopId) {
            onActiveStopChange(bestStopId);
          }
        }
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.55, 0.75],
      }
    );

    for (const stop of allStops) {
      const node = stopRefs.current.get(stop.id);
      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [allStops, onActiveStopChange]);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{group.title}</h2>
              <p className="text-sm text-slate-500">{group.subtitle}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {group.stops.length} stops
            </span>
          </div>

          <div className="space-y-4">
            {group.stops.map((stop) => {
              const isActive = stop.id === activeStopId;
              const hasHotspotLink = Boolean(stop.hotspotId && !stop.hotspotId.startsWith("custom"));
              const isVisible = revealedStopSet.has(stop.id);
              const previewUrls = buildPreviewUrls(stop);
              const leadPreviewUrl = previewUrls[0] ?? stop.imageUrl;
              const smallPreviewUrls = previewUrls.slice(1, 5);
              const overflowCount = Math.max(stop.mediaCount - (1 + smallPreviewUrls.length), 0);

              return (
                <article
                  key={stop.id}
                  ref={setStopRef(stop.id)}
                  data-stop-id={stop.id}
                  className={cn(
                    "relative overflow-hidden rounded-3xl border bg-white/88 shadow-[0_20px_40px_-28px_rgba(10,18,35,0.85)] backdrop-blur-xl",
                    "transition-all duration-700",
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                    isActive ? "border-emerald-300/70 ring-1 ring-emerald-200/70" : "border-slate-200/75"
                  )}
                >
                  <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-4 md:grid-rows-2 md:gap-2.5">
                    <button
                      type="button"
                      onClick={() => onImageClick?.(stop, leadPreviewUrl)}
                      className={cn(
                        "group relative col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left",
                        "aspect-[16/10] md:row-span-2 md:aspect-auto",
                        onImageClick ? "cursor-pointer" : "cursor-default"
                      )}
                      disabled={!onImageClick}
                    >
                      <OptimizedImage
                        src={leadPreviewUrl}
                        alt={stop.name}
                        fill
                        enableRetry
                        showSkeleton
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 620px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/10 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/55 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm">
                        Stop {stop.order}
                      </span>
                      <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
                        {stop.categoryLabel}
                      </span>
                    </button>

                    {smallPreviewUrls.map((imageUrl, index) => {
                      const showOverflow = overflowCount > 0 && index === smallPreviewUrls.length - 1;

                      return (
                        <button
                          key={`${stop.id}-${imageUrl}-${index}`}
                          type="button"
                          onClick={() => onImageClick?.(stop, imageUrl)}
                          className={cn(
                            "group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left",
                            onImageClick ? "cursor-pointer" : "cursor-default"
                          )}
                          disabled={!onImageClick}
                        >
                          <OptimizedImage
                            src={imageUrl}
                            alt={`${stop.name} photo ${index + 2}`}
                            fill
                            enableRetry
                            showSkeleton
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            sizes="(max-width: 768px) 48vw, 190px"
                          />
                          {showOverflow ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/58 text-white">
                              <span className="text-xl font-semibold">+{overflowCount}</span>
                              <span className="text-[11px] uppercase tracking-[0.08em] text-white/85">more</span>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-slate-900">{stop.name}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {stop.province || "Belgium"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {stop.visitedLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <Camera className="h-3.5 w-3.5" />
                          {stop.mediaCount} memories
                        </span>
                        {typeof stop.distanceFromPreviousKm === "number" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                            +{stop.distanceFromPreviousKm.toFixed(1)} km since last stop
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {stop.note ? <p className="text-sm leading-relaxed text-slate-700">{stop.note}</p> : null}

                    <div className="flex flex-wrap gap-2">
                      {hasHotspotLink ? (
                        <Link
                          href={`/hotspots/${stop.hotspotId}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Explore hotspot
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      ) : null}

                      {onAddMemory ? (
                        <button
                          type="button"
                          onClick={() => onAddMemory(stop)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f766e] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0d5f5a]"
                        >
                          Add memory
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
