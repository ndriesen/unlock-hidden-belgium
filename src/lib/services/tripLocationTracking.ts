import { supabase } from "@/lib/Supabase/browser-client";

export interface TripLocation {
  id: string;
  tripId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: string;
  createdAt: string;
}

interface TripLocationRow {
  id: string;
  trip_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: string;
  created_at: string;
}

export interface PhotoLocation {
  id: string;
  tripId: string;
  tripStopId: string | null;
  storagePath: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface PhotoLocationRow {
  id: string;
  trip_id: string;
  trip_stop_id: string | null;
  storage_path: string;
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  uploaded_by: string;
  created_at: string;
}

// Location tracking types
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: Date;
}

// Record a location point during a trip
export async function recordTripLocation(
  tripId: string,
  userId: string,
  location: LocationUpdate
): Promise<void> {
  await supabase.from("trip_locations").insert({
    trip_id: tripId,
    user_id: userId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy ?? null,
    altitude: location.altitude ?? null,
    timestamp: location.timestamp ?? new Date().toISOString(),
  });
}

// Get all location points for a trip
export async function getTripLocations(tripId: string): Promise<TripLocation[]> {
  const { data, error } = await supabase
    .from("trip_locations")
    .select("*")
    .eq("trip_id", tripId)
    .order("timestamp", { ascending: true });

  if (error || !data) {
    return [];
  }

  const rows = data as TripLocationRow[];
  return rows.map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    altitude: row.altitude,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
}

// Delete old location data for a trip
export async function clearTripLocations(tripId: string): Promise<void> {
  await supabase.from("trip_locations").delete().eq("trip_id", tripId);
}

// Record photo location from EXIF data
export async function recordPhotoLocation(params: {
  tripId: string;
  tripStopId?: string;
  storagePath: string;
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  uploadedBy: string;
}): Promise<void> {
  await supabase.from("trip_photo_locations").insert({
    trip_id: params.tripId,
    trip_stop_id: params.tripStopId ?? null,
    storage_path: params.storagePath,
    latitude: params.latitude ?? null,
    longitude: params.longitude ?? null,
    taken_at: params.takenAt?.toISOString() ?? null,
    uploaded_by: params.uploadedBy,
  });
}

// Get photo locations for a trip
export async function getTripPhotoLocations(tripId: string): Promise<PhotoLocation[]> {
  const { data, error } = await supabase
    .from("trip_photo_locations")
    .select("*")
    .eq("trip_id", tripId)
    .order("taken_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const rows = data as PhotoLocationRow[];
  return rows.map((row) => ({
    id: row.id,
    tripId: row.trip_id,
    tripStopId: row.trip_stop_id,
    storagePath: row.storage_path,
    latitude: row.latitude,
    longitude: row.longitude,
    takenAt: row.taken_at,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }));
}

// Find nearby hotspots based on recorded locations
export async function findNearbyHotspotsForTrip(
  tripId: string,
  radiusKm: number = 5
): Promise<{ latitude: number; longitude: number }[]> {
  const locations = await getTripLocations(tripId);
  
  if (locations.length === 0) {
    return [];
  }

  // Get unique center points (sample every ~10 minutes)
  const sampledLocations: { latitude: number; longitude: number }[] = [];
  const interval = 10 * 60 * 1000; // 10 minutes in ms
  
  let currentIntervalStart = locations[0].timestamp;
  
  for (const loc of locations) {
    const locTime = new Date(loc.timestamp).getTime();
    const intervalStart = new Date(currentIntervalStart).getTime();
    
    if (locTime - intervalStart >= interval) {
      sampledLocations.push({ latitude: loc.latitude, longitude: loc.longitude });
      currentIntervalStart = loc.timestamp;
    }
  }
  
  // Always add the last location
  if (locations.length > 0) {
    const lastLoc = locations[locations.length - 1];
    sampledLocations.push({ latitude: lastLoc.latitude, longitude: lastLoc.longitude });
  }

  return sampledLocations;
}

// Browser Geolocation API wrapper
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// Calculate distance between two coordinates using Haversine formula
// Returns distance in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Check if a location is within a certain radius (in kilometers) of a point
export function isWithinRadius(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number = 0.5
): boolean {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon);
  return distance <= radiusKm;
}

// Watch location during active trip
let locationWatchId: number | null = null;

export function startLocationTracking(
  tripId: string,
  userId: string,
  onLocationUpdate: (location: LocationUpdate) => void,
  onError: (error: Error) => void
): void {
  if (locationWatchId !== null) {
    stopLocationTracking();
  }

  locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      const location: LocationUpdate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        altitude: position.coords.altitude ?? undefined,
        timestamp: new Date(position.timestamp),
      };

      // Save to database
      try {
        await recordTripLocation(tripId, userId, location);
      } catch (err) {
        console.error("Failed to record location:", err);
      }

      onLocationUpdate(location);
    },
    (error) => {
      onError(new Error(error.message));
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000,
    }
  );
}

export function stopLocationTracking(): void {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
}

export function isLocationTracking(): boolean {
  return locationWatchId !== null;
}

