import { useState, useEffect } from 'react';
import type { Trip } from '@/types/trip';
import { demoTrips } from '@/data/tripMocks';

export function useTripData(tripId?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock → Replace with Supabase query:
    // supabase.from('trips').select('*').eq('id', tripId || user trips)
    
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(r => setTimeout(r, 800));
        setTrips(demoTrips);
      } catch (err) {
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId]);

  const currentTrip = trips[0]; // Default to first (premium demo)

  const getStopState = (stop: Trip['stops'][0], tripStart: string) => {
    const now = new Date().toISOString();
    const visitedDate = stop.visitedAt;
    
    if (visitedDate && new Date(visitedDate) < new Date(tripStart)) {
      return 'visited'; // Past
    }
    if (visitedDate) {
      return 'current'; // Recently visited
    }
    return 'upcoming'; // Future/wishlist
  };

  return {
    trips,
    currentTrip,
    loading,
    error,
    refetch: () => {/* impl */},
    getStopState
  };
}
