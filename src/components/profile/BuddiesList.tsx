"use client";

import Image from 'next/image';
import Link from 'next/link';

interface Buddy {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
}

interface BuddiesListProps {
  buddies: Buddy[];
  title?: string;
}

export function BuddiesList({ buddies, title = "Buddies" }: BuddiesListProps) {
  if (buddies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-2xl">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          👥
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm">No buddies yet. Invite friends to explore together!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title} ({buddies.length})</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {buddies.map((buddy) => (
          <Link
            key={buddy.id}
            href={`/profile/${buddy.id}`}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent" />
            {buddy.avatar_url ? (
              <Image
                src={buddy.avatar_url}
                alt={buddy.name}
                fill
                sizes="100px"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700 shadow-sm">
                {buddy.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs font-semibold text-white bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 truncate">
                {buddy.name}
              </p>
              {buddy.city && (
                <p className="text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-0.5 mt-1 truncate">
                  {buddy.city}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

