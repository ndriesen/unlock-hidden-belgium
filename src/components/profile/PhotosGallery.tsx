"use client";

import Image from 'next/image';

interface Photo {
  id: string;
  public_url: string;
  created_at: string;
}

interface PhotosGalleryProps {
  photos: Photo[];
}

export function PhotosGallery({ photos }: PhotosGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          📸
        </div>
        <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
        <p className="text-sm">Share your discoveries!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Memories ({photos.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.slice(0, 20).map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <Image
              src={photo.public_url}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <div className="text-white text-xs truncate w-full">
                {new Date(photo.created_at).toLocaleDateString('nl-BE')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

