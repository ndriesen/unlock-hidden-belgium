import { supabase } from "@/lib/Supabase/browser-client";
import type { Hotspot } from "@/types/hotspot";

export interface NearbyHotspot {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

/**
 * Get hotspots within radius using PostGIS
 * @param lat - User latitude
 * @param lng - User longitude  
 * @param radiusMeters - Radius in meters (default 2000m)
 * @param limit - Max results (default 20)
 */
export async function getNearbyHotspots(
  lat: number, 
  lng: number, 
  radiusMeters = 2000,
  limit = 20,
  offset = 0
): Promise<NearbyHotspot[]> {
  const { data, error } = await supabase.rpc('get_nearby_hotspots', {
    p_lat: lat,
    p_lng: lng,
    p_radius_meters: radiusMeters,
    p_limit: limit,
    p_offset: offset
  });

  if (error) {
    console.error('Nearby hotspots error:', error);
    throw error;
  }

  return data as NearbyHotspot[];
}

/**
 * Get proximity hotspots for notifications (1km, 500m tiers)
 */
export async function getProximityAlerts(
  lat: number, 
  lng: number
): Promise<{
  within_1km: NearbyHotspot[];
  within_500m: NearbyHotspot[];
}> {
  const allNearby = await getNearbyHotspots(lat, lng, 1000);
  
  return {
    within_1km: allNearby,
    within_500m: allNearby.filter(h => h.distance_meters <= 500)
  };
}

/**
 * Single hotspot distance check
 */
export async function getDistanceToHotspot(
  hotspotId: string,
  lat: number, 
  lng: number
): Promise<number | null> {
  const nearby = await getNearbyHotspots(lat, lng, 5000, 1);
  return nearby[0]?.id === hotspotId ? nearby[0].distance_meters : null;
}

