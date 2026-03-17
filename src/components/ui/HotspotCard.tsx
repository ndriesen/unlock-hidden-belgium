"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  images: string[];
  category: string;
}

interface HotspotCardProps {
  hotspot: Hotspot;
  onSelect?: () => void;
  className?: string;
}

export default function HotspotCard({ hotspot, onSelect, className = '' }: HotspotCardProps) {
  return (
    <div className={`hotspot-card card-lift cursor-pointer ${className}`} onClick={onSelect}>
      <div className="relative w-full h-full">
        <Image
          src={hotspot.images[0] || '/images/placeholder-image.svg'}
          alt={hotspot.name}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0VD/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/8QAFhEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIRAxEAPwCdK0gVkrXbHhUl5g0WAAEEAAAAB//2Q=="
          loading="lazy"
        />
        <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Heart className="w-5 h-5 text-gray-600" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="card-title text-xl font-bold mb-1">{hotspot.name}</h3>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-sm font-semibold text-gray-700 shadow-md">
            {hotspot.category}
          </span>
        </div>
      </div>
    </div>
  );
}
