"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaVisibility } from "@/lib/services/media";

interface PhotoItem {
  id: string;
  signedUrl: string;
  caption: string;
  visibility: string;
  createdAt: string;
  uploadedBy?: string;
}

interface OrganizedPhotoGalleryProps {
  personal: PhotoItem[];
  community: PhotoItem[];
  inspiration: string[];
  currentUserId?: string | null;
  onUpload?: () => void;
  onDelete?: (photoId: string) => void;
  onVisibilityChange?: (photoId: string, visibility: MediaVisibility) => void;
  hotspotName: string;
}

export default function OrganizedPhotoGallery({
  personal,
  community,
  inspiration,
  currentUserId,
  onUpload,
  onDelete,
  onVisibilityChange,
  hotspotName,
}: OrganizedPhotoGalleryProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine all photos in priority order for lightbox navigation
  const allPhotos: string[] = [
    ...personal.map(p => p.signedUrl),
    ...community.map(c => c.signedUrl),
    ...inspiration
  ];

  const openLightbox = (url: string, index: number) => {
    setLightboxImage(url);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    const newIndex = direction === "prev"
      ? (lightboxIndex - 1 + allPhotos.length) % allPhotos.length
      : (lightboxIndex + 1) % allPhotos.length;
    setLightboxIndex(newIndex);
    setLightboxImage(allPhotos[newIndex]);
  };

  const PhotoGrid = ({
    photos,
    showCredit = false,
    showEditControls = false,
    isOwner = false,
  }: {
    photos: PhotoItem[] | string[];
    showCredit?: boolean;
    showEditControls?: boolean;
    isOwner?: boolean;
  }) => {
    if (photos.length === 0) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {photos.map((photo, index) => {
          const url = typeof photo === "string" ? photo : photo.signedUrl;
          const caption = typeof photo === "string" ? "" : photo.caption;
          const id = typeof photo === "string" ? `insp-${index}` : photo.id;
          const visibility = typeof photo === "string" ? "public" : photo.visibility;
          const createdAt = typeof photo === "string" ? "" : photo.createdAt;

          return (
            <div
              key={id}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group cursor-pointer"
              onClick={() => openLightbox(url, index)}
            >
              <Image
                src={url}
                alt={caption || `${hotspotName} photo`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

              {/* Caption overlay */}
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">{caption}</p>
                </div>
              )}

              {/* Credit for community photos */}
              {showCredit && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">
                    Photo by traveler
                  </span>
                </div>
              )}

              {/* Edit controls for own photos */}
              {showEditControls && isOwner && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {onVisibilityChange && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newVisibility = visibility === "private" ? "public" : "private";
                        onVisibilityChange(id, newVisibility as MediaVisibility);
                      }}
                      className="bg-black/50 text-white p-1 rounded text-[10px]"
                      title="Toggle visibility"
                    >
                      {visibility === "private" ? "🔒" : "🌐"}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                      }}
                      className="bg-red-500 text-white p-1 rounded text-[10px]"
                      title="Delete photo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Inspiration label */}
              {typeof photo === "string" && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                    Inspiration
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const SectionHeader = ({
    title,
    count,
    action
  }: {
    title: string;
    count: number;
    action?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-2">
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
        <span className="ml-2 text-slate-500 font-normal">({count})</span>
      </h3>
      {action}
    </div>
  );

  const hasAnyPhotos = personal.length > 0 || community.length > 0 || inspiration.length > 0;

  if (!hasAnyPhotos) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-600 mb-3">No photos yet. Be the first to add a memory!</p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold"
          >
            Add Memory
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Photos Section - Only show if user is logged in */}
      {personal.length > 0 && currentUserId && (
        <section>
          <SectionHeader
            title="Your photos"
            count={personal.length}
            action={
              onUpload && (
                <button
                  onClick={onUpload}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Add more
                </button>
              )
            }
          />
          <PhotoGrid
            photos={personal}
            showEditControls
            isOwner
          />
        </section>
      )}

      {/* Community Photos Section */}
      {community.length > 0 && (
        <section>
          <SectionHeader
            title="Community photos"
            count={community.length}
          />
          <PhotoGrid
            photos={community}
            showCredit
          />
        </section>
      )}

      {/* Inspiration Section - Database filler images */}
      {inspiration.length > 0 && (
        <section>
          <SectionHeader
            title="Inspiration"
            count={inspiration.length}
          />
          <PhotoGrid photos={inspiration} />
        </section>
      )}

      {/* Upload button if user has no photos but community does */}
      {personal.length === 0 && onUpload && currentUserId && (
        <div className="pt-2">
          <button
            onClick={onUpload}
            className="rounded-lg border border-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Add your photos
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt={`${hotspotName} - Full view`}
              width={1600}
              height={900}
              className="max-w-full max-h-[90vh] object-contain"
              sizes="90vw"
              quality={90}
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightboxIndex + 1} / {allPhotos.length}
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-xs">
            Click outside or press ESC to close • Use arrow keys to navigate
          </div>
        </div>
      )}
    </div>
  );
}

