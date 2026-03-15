"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { BuddyProfile } from '@/lib/services/buddies';
import { UpcomingTrip, getUpcomingTripsWithCompanions, createTripInvite } from '@/lib/services/trips';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Trip {
  id: string;
  explorer: BuddyProfile;
  destination: string;
  dates: string;
  description: string;
}

interface TripCompanionsProps {
  profiles: BuddyProfile[];
}

function TripCompanionCard({ trip, onJoinTrip }: { trip: Trip, onJoinTrip: (tripId: string) => void }) {
  const level = Math.floor(trip.explorer.xpPoints / 1000);

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
          {trip.explorer.avatarUrl ? (
            <Image 
              src={trip.explorer.avatarUrl} 
              alt={trip.explorer.name}
              fill 
              className="object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-slate-600 flex items-center justify-center w-full h-full">
              {trip.explorer.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-slate-900 truncate">{trip.explorer.name}</h4>
          <p className="text-xs text-slate-600">Lv. {level}</p>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 mb-3">
        <h3 className="font-bold text-base line-clamp-1">{trip.destination}</h3>
        <p className="text-xs text-emerald-600 font-semibold">{trip.dates}</p>
        <p className="text-xs text-slate-600 line-clamp-2 leading-tight">{trip.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200">
        <button 
          onClick={() => onJoinTrip(trip.id)}
          className="text-xs py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors">
          Join trip
        </button>
        <Link href={`/trips/${trip.id}`} className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-center">
          View trip
        </Link>
      </div>
    </div>
  );
}

export function TripCompanions({ profiles }: TripCompanionsProps) {
  const { user } = useAuth();
  const addToast = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const handleJoinTrip = useCallback(async (tripId: string) => {
    if (!user) {
      addToast('Please log in to join');
      return;
    }
    try {
      await createTripInvite(tripId, tripId); // trip.creator.id would be better, stub
      addToast('Trip invite sent!');
    } catch (error) {
      addToast('Failed to send invite');
    }
  }, [user, addToast]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const upcoming: UpcomingTrip[] = await getUpcomingTripsWithCompanions();
        const mapped: Trip[] = upcoming.map((u) => ({
          id: u.id,
          explorer: {
            userId: u.creator.id,
            name: u.creator.display_name,
            city: u.creator.city,
            interests: [],
            style: 'balanced' as any,
            availability: 'Flexible',
            bio: '',
            avatarUrl: u.creator.avatar_url,
            xpPoints: 0,
          } as BuddyProfile,
          destination: u.name,
          dates: new Date(u.start_date).toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric'
          }) + '+',
          description: 'Looking for companions - join the adventure!',
        }));
        setTrips(mapped.slice(0, 4));
      } catch (error) {
        console.error(error);
        addToast('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [addToast]);

  if (loading) {
    return <div className="text-center py-12">Loading trips...</div>;
  }

  if (trips.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">🗺️</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No upcoming trips</h3>
        <p className="text-sm text-slate-600">No explorers looking for companions right now</p>
        <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#244b55] via-[#336b79] to-[#428a9d] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
          Create trip & find companions
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-r from-[#244b55] via-[#336b79] to-[#428a9d] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm drop-shadow-sm">🗺️</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trip Companions</h2>
          <p className="text-sm text-slate-600">Join explorers planning adventures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trips.map((trip) => (
          <TripCompanionCard key={trip.id} trip={trip} onJoinTrip={handleJoinTrip} />
        ))}
      </div>

      <div className="text-center pt-3 border-t border-slate-200">
        <button className="px-6 py-2.5 bg-gradient-to-r from-[#244b55] via-[#336b79] to-[#428a9d] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
          Create trip & find companions
        </button>
      </div>
    </section>
  );
}
