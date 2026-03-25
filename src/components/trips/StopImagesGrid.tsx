"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { TripMedia } from "@/types/trip";

interface StopImagesGridProps {
  media: TripMedia[];
  stopName: string;
  className?: string;
}

function getOrderedMedia(media: TripMedia[]): TripMedia[] {
  if (media.length <= 1) {
    return media;
  }

  const leadIndex = media.findIndex((item) => item.isHighlight);
  if (leadIndex <= 0) {
    return media;
  }

  const leadMedia = media[leadIndex];
  const beforeLead = media.slice(0, leadIndex);
  const afterLead = media.slice(leadIndex + 1);

  return [leadMedia, ...beforeLead, ...afterLead];
}

export default function StopImagesGrid({ media, stopName, className = "" }: StopImagesGridProps) {
  const [lightboxImage, setLightboxImage] = useState<TripMedia | null>(null);
  const orderedMedia = useMemo(() => getOrderedMedia(media), [media]);

  const leadMedia = orderedMedia[0] ?? null;
  const secondaryMedia = orderedMedia.slice(1, 5);
  const totalCount = orderedMedia.length;
  const visibleCount = leadMedia ? 1 + secondaryMedia.length : secondaryMedia.length;
  const overflowCount = Math.max(totalCount - visibleCount, 0);

  const openLightbox = useCallback((image: TripMedia) => {
    setLightboxImage(image);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const navigateLightbox = useCallback(
    (direction: "prev" | "next") => {
      if (!lightboxImage || totalCount === 0) return;

      const currentIdx = orderedMedia.findIndex((item) => item.id === lightboxImage.id);
      if (currentIdx < 0) return;

      const nextIdx = direction === "prev" ? (currentIdx - 1 + totalCount) % totalCount : (currentIdx + 1) % totalCount;
      setLightboxImage(orderedMedia[nextIdx]);
    },
    [lightboxImage, orderedMedia, totalCount]
  );

  if (!totalCount) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No photos yet for this stop.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:grid-rows-2 md:gap-2.5">
        {leadMedia ? (
          <button
            type="button"
            onClick={() => openLightbox(leadMedia)}
            className="group relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left md:row-span-2 md:aspect-auto"
            aria-label={`View lead photo of ${stopName}`}
          >
            <Image
              src={leadMedia.signedUrl}
              alt={leadMedia.caption || `${stopName} lead photo`}
              fill
              sizes="(max-width: 768px) 100vw, 620px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              Lead
            </span>
          </button>
        ) : null}

        {secondaryMedia.map((item, index) => {
          const showOverflow = overflowCount > 0 && index === secondaryMedia.length - 1;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openLightbox(item)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              aria-label={`View photo ${index + 2} of ${stopName}`}
            >
              <Image
                src={item.signedUrl}
                alt={item.caption || `${stopName} photo ${index + 2}`}
                fill
                sizes="(max-width: 768px) 48vw, 190px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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

      {lightboxImage ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={closeLightbox}>
          <button
            className="absolute right-6 top-6 z-[101] rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-white/20"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {totalCount > 1 ? (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  navigateLightbox("prev");
                }}
                className="absolute left-6 top-1/2 z-[101] h-14 w-14 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white transition-colors hover:bg-white/40"
                aria-label="Previous photo"
              >
                &lt;
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  navigateLightbox("next");
                }}
                className="absolute right-6 top-1/2 z-[101] h-14 w-14 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white transition-colors hover:bg-white/40"
                aria-label="Next photo"
              >
                &gt;
              </button>
            </>
          ) : null}

          <div className="relative h-[min(80vh,780px)] w-[min(92vw,1200px)]" onClick={(event) => event.stopPropagation()}>
            <Image
              src={lightboxImage.signedUrl}
              alt={lightboxImage.caption || `${stopName} photo`}
              fill
              sizes="92vw"
              className="object-contain"
              priority
            />
            {lightboxImage.caption ? (
              <div className="absolute bottom-8 left-1/2 max-w-[90vw] -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-center text-sm text-white">
                {lightboxImage.caption}
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 font-mono text-sm text-white/90">
            {orderedMedia.findIndex((item) => item.id === lightboxImage.id) + 1} / {totalCount}
          </div>
        </div>
      ) : null}
    </div>
  );
}
