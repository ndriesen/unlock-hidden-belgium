"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface GalleryCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: "4/3" | "16/9" | "3/2" | "1/1";
  showCounter?: boolean;
  showArrows?: boolean;
  onImageClick?: (index: number) => void;
  className?: string;
}

export default function GalleryCarousel({
  images: imagesProp,
  alt,
  aspectRatio = "16/9",
  showCounter = true,
  showArrows = true,
  onImageClick,
  className = "",
}: GalleryCarouselProps) {
  // Ensure images is always an array, handle null/undefined
  const images = Array.isArray(imagesProp) ? imagesProp : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const aspectRatioClasses: Record<string, string> = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "3/2": "aspect-[3/2]",
    "1/1": "aspect-square",
  };

  const checkScrollCapabilities = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollCapabilities);
    checkScrollCapabilities();

    return () => {
      container.removeEventListener("scroll", checkScrollCapabilities);
    };
  }, [checkScrollCapabilities, images]);

  const scrollTo = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const { clientWidth } = container;
    const scrollAmount = direction === "left" ? -clientWidth : clientWidth;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, clientWidth, scrollWidth } = container;
    const newIndex = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(newIndex);
    checkScrollCapabilities();
  };

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    } else {
      setLightboxImage(images[index]);
    }
  };

  // Handle keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage) {
        setLightboxImage(null);
      }
    };

    if (lightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImage]);

  if (images.length === 0) {
    return (
      <div
        className={`relative w-full ${aspectRatioClasses[aspectRatio]} bg-slate-100 rounded-lg overflow-hidden`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          No images available
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* Main Carousel Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((image, index) => (
            <div
              key={`${image}_${index}`}
              className={`relative w-full flex-shrink-0 snap-center ${aspectRatioClasses[aspectRatio]}`}
            >
              <button
                onClick={() => handleImageClick(index)}
                className="absolute inset-0 w-full h-full cursor-zoom-in"
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${alt} - Image ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <button
              onClick={() => scrollTo("left")}
              disabled={!canScrollLeft}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg text-slate-800 transition-all duration-200 hover:bg-white ${
                canScrollLeft
                  ? "opacity-80 hover:opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() => scrollTo("right")}
              disabled={!canScrollRight}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg text-slate-800 transition-all duration-200 hover:bg-white ${
                canScrollRight
                  ? "opacity-80 hover:opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {showCounter && images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Scroll Indicators (dots) */}
        {showCounter && images.length > 1 && images.length <= 8 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={`dot_${index}`}
                onClick={() => {
                  const container = scrollRef.current;
                  if (!container) return;
                  const { clientWidth } = container;
                  container.scrollTo({
                    left: index * clientWidth,
                    behavior: "smooth",
                  });
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={() => setLightboxImage(null)}
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

          {/* Navigation in Lightbox */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.indexOf(lightboxImage);
                  const prevIdx = currentIdx > 0 ? currentIdx - 1 : images.length - 1;
                  setLightboxImage(images[prevIdx]);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.indexOf(lightboxImage);
                  const nextIdx = currentIdx < images.length - 1 ? currentIdx + 1 : 0;
                  setLightboxImage(images[nextIdx]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
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
              alt={`${alt} - Full view`}
              width={1600}
              height={900}
              className="max-w-full max-h-[90vh] object-contain"
              sizes="90vw"
              quality={90}
              priority
            />
          </div>

          {/* Image Counter in Lightbox */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {images.indexOf(lightboxImage) + 1} / {images.length}
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-xs">
            Click outside or press ESC to close • Use arrow keys to navigate
          </div>
        </div>
      )}
    </>
  );
}

