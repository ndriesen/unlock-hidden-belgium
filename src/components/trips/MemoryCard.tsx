"use client";

import Image from "next/image";

interface MemoryCardProps {
  memory: {
    id: string;
    caption: string;
    locationName?: string;
    createdAt: string;
  };
  photos: {
    id: string;
    signedUrl: string;
  }[];
}

export default function MemoryCard({ memory, photos }: MemoryCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Adaptive photo layout
  const renderPhotos = () => {
    if (photos.length === 0) return null;

    if (photos.length === 1) {
      return (
        <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden">
          <Image
            src={photos[0].signedUrl}
            alt={memory.caption || "Memory"}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      );
    }

    if (photos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={photo.signedUrl}
                alt={memory.caption || "Memory"}
                fill
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
            </div>
          ))}
        </div>
      );
    }

    if (photos.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden row-span-2">
            <Image
              src={photos[0].signedUrl}
              alt={memory.caption || "Memory"}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 768px) 50%, 200px"
            />
          </div>
          {photos.slice(1).map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={photo.signedUrl}
                alt={memory.caption || "Memory"}
                fill
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 100px"
              />
            </div>
          ))}
        </div>
      );
    }

    // 4+ photos - grid layout
    return (
      <div className="grid grid-cols-2 gap-1">
        {photos.slice(0, 4).map((photo, idx) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
            <Image
              src={photo.signedUrl}
              alt={memory.caption || "Memory"}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
            {idx === 3 && photos.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold">+{photos.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Hero Photo */}
      {renderPhotos()}

      {/* Content */}
      <div className="p-4 space-y-3">
        {memory.caption && (
          <p className="text-sm text-slate-700 italic">"{memory.caption}"</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {memory.locationName && (
              <span className="flex items-center gap-1">
                📍 {memory.locationName}
              </span>
            )}
            <span>{formatDate(memory.createdAt)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1">
              ♡ <span className="text-slate-400">0</span>
            </button>
            <button className="text-xs text-slate-500 hover:text-blue-500 flex items-center gap-1">
              💬 <span className="text-slate-400">0</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

