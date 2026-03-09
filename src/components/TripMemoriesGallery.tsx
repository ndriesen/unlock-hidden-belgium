"use client";

import Image from "next/image";
import { useState } from "react";

interface PhotoItem {
  id: string;
  signedUrl: string;
  caption: string;
  visibility: string;
  createdAt: string;
  uploadedBy?: string;
}

interface TripMemoriesGalleryProps {
  personal: PhotoItem[];
  community: PhotoItem[];
  inspiration: string[];
  currentUserId?: string | null;
  hotspotName: string;
}

export default function TripMemoriesGallery({
  personal,
  community,
  inspiration,
  currentUserId,
  hotspotName,
}: TripMemoriesGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const totalOther = community.length + inspiration.length;

  const allPhotos = showAll 
    ? [...personal.map(p => p.signedUrl), ...community.map(c => c.signedUrl), ...inspiration]
    : personal.map(p => p.signedUrl);

  const openLightbox = (url: string, index: number) => {
    setLightboxImage(url);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (allPhotos.length === 0) return;
    const newIndex = direction === "prev"
      ? (lightboxIndex - 1 + allPhotos.length) % allPhotos.length
      : (lightboxIndex + 1) % allPhotos.length;
    setLightboxIndex(newIndex);
    setLightboxImage(allPhotos[newIndex]);
  };

  // Empty state
  if (personal.length === 0 && !currentUserId) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-600">No personal memories yet.</p>
      </div>
    );
  }

  // Lightbox component
  const Lightbox = () => {
    if (!lightboxImage || allPhotos.length === 0) return null;
    
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        onClick={closeLightbox}
      >
        <button
          className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
          onClick={closeLightbox}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {allPhotos.length > 1 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        
        {allPhotos.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        
        <Image
          src={lightboxImage}
          alt={hotspotName}
          width={1200}
          height={900}
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-4 text-white/80 text-sm">
          {lightboxIndex + 1} / {allPhotos.length}
        </div>
      </div>
    );
  };

  // Personal photos only (default view)
  if (!showAll) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Your memories ({personal.length})
          </p>
          {totalOther > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Show {totalOther} more from community
            </button>
          )}
        </div>

        {personal.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {personal.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => openLightbox(photo.signedUrl, index)}
              >
                <Image
                  src={photo.signedUrl}
                  alt={photo.caption || `${hotspotName} photo`}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No photos yet. Add your first memory!</p>
        )}

        <Lightbox />
      </div>
    );
  }

  // Show all (personal + community + inspiration)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          All photos ({personal.length + community.length + inspiration.length})
        </p>
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-slate-600 hover:text-slate-700 font-medium"
        >
          Just your photos
        </button>
      </div>

      {personal.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Your photos</p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {personal.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => openLightbox(photo.signedUrl, index)}
              >
                <Image
                  src={photo.signedUrl}
                  alt={photo.caption || hotspotName}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {community.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Community photos</p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {community.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => openLightbox(photo.signedUrl, personal.length + index)}
              >
                <Image
                  src={photo.signedUrl}
                  alt={photo.caption || hotspotName}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-black/50 text-white px-1.5 py-0.5 rounded">traveler</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inspiration.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Inspiration</p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {inspiration.map((url, index) => (
              <div
                key={`insp-${index}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => openLightbox(url, personal.length + community.length + index)}
              >
                <Image
                  src={url}
                  alt={`${hotspotName} inspiration`}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-amber-500/80 text-white px-1.5 py-0.5 rounded">inspiration</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Lightbox />
    </div>
  );
}

