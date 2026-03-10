"use client";

import Image from "next/image";

interface Photo {
  id: string;
  signedUrl: string;
  isHighlight?: boolean;
}

interface TripHighlightsProps {
  photos: Photo[];
}

export default function TripHighlights({ photos }: TripHighlightsProps) {
  // Filter to only show highlight photos
  const highlightPhotos = photos.filter(photo => photo.isHighlight);
  
  if (highlightPhotos.length === 0) return null;

  // Get top 3 highlight photos
  const highlights = highlightPhotos.slice(0, 3);

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Trip Highlights</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {highlights.map((photo, index) => (
          <div
            key={photo.id}
            className={`relative rounded-lg overflow-hidden bg-slate-100 ${
              index === 0 ? "aspect-[4/5] col-span-2 row-span-2" : "aspect-square"
            }`}
          >
            <Image
              src={photo.signedUrl}
              alt="Trip highlight"
              fill
              loading="lazy"
              className="object-cover"
              sizes={
                index === 0
                  ? "(max-width: 768px) 66vw, 400px"
                  : "(max-width: 768px) 33vw, 200px"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

