"use client";

import Link from 'next/link';

interface Trip {
  id: string;
  name: string;
  created_at: string;
  buddy_ids: string[];
  buddyNames: string[];
}

interface TripsListProps {
  trips: Trip[];
}

export function TripsList({ trips }: TripsListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          🗺️
        </div>
        <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
        <p className="text-sm">Create your first trip adventure!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Trips ({trips.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.slice(0, 6).map((trip, index) => (
          <Link
            key={trip.id || `trip-${index}`}
            href={`/trips/${trip.id}`}
            className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative h-40 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#10b98120_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#3b82f620_0%,transparent_50%)]" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
                  {trip.buddyNames.length > 0 ? 'Group Trip' : 'Solo Adventure'}
                </span>
              </div>
              <h4 className="font-bold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                {trip.name}
              </h4>
              {trip.buddyNames.length > 0 && (
                <div className="flex -space-x-2 mb-3">
                  {trip.buddyNames.slice(0, 3).map((name, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 z-[calc(3-${i})]"
                    >
                      {name.charAt(0)}
                    </div>
                  ))}
                  {trip.buddyNames.length > 3 && (
                    <div className="w-8 h-8 bg-slate-200 border-2 border-white rounded-full flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0 z-10">
                      +{trip.buddyNames.length - 3}
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-slate-500">
                {new Date(trip.created_at).toLocaleDateString('nl-BE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {trips.length > 6 && (
        <div className="text-center pt-6">
          <Link 
            href="#" 
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline"
          >
            View all trips →
          </Link>
        </div>
      )}
    </div>
  );
}

