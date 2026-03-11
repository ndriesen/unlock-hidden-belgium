import { supabase } from "@/lib/Supabase/browser-client";
import { RANKING_QUERY_CONFIG } from "@/lib/constants/ranking";

/**
 * Ranking data from the materialized view
 */
export interface HotspotRanking {
  hotspot_id: string;
  hotspot_name: string;
  latitude: number;
  longitude: number;
  category: string;
  province: string;
  description: string | null;
  images: string[] | null;
  tags: string[] | null;
  saves_count: number;
  views_count: number;
  trip_visits_count: number;
  created_at: string;
  status: string;
  popularity_score: number;
  recency_score: number;
  quality_score: number;
  trip_usage_score: number;
  social_score: number;
  ranking_score: number;
}

/**
 * Parameters for nearby hotspot query
 */
export interface NearbyHotspotsParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

/**
 * Parameters for travel buddy hotspots query
 */
export interface TravelBuddyHotspotsParams {
  userId: string;
  limit?: number;
}

/**
 * Get the top ranked hotspots
 * Used for GlobeHero and discovery feeds
 */
export async function getTopHotspots(limit: number = RANKING_QUERY_CONFIG.DEFAULT_LIMIT): Promise<HotspotRanking[]> {
  try {
    const { data, error } = await supabase
      .from('hotspot_rankings')
      .select('*')
      .order('ranking_score', { ascending: false })
      .limit(limit);

    if (error) {
      // Materialized view might not exist yet - return empty array
      console.warn('Ranking view not available:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    // Handle network errors or other issues gracefully
    console.warn('Error fetching top hotspots:', error);
    return [];
  }
}

/**
 * Get trending hotspots (high popularity + recency)
 * Good for "What's Hot" sections
 */
export async function getTrendingHotspots(limit: number = RANKING_QUERY_CONFIG.DEFAULT_LIMIT): Promise<HotspotRanking[]> {
  // Trending = high popularity with good recency
  const { data, error } = await supabase
    .from('hotspot_rankings')
    .select('*')
    .order('popularity_score', { ascending: false })
    .order('recency_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending hotspots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get hotspots near a specific location
 * Used for map view and trip planning
 */
export async function getNearbyHotspots({
  lat,
  lng,
  radiusKm = RANKING_QUERY_CONFIG.NEARBY_RADIUS_KM,
  limit = RANKING_QUERY_CONFIG.DEFAULT_LIMIT
}: NearbyHotspotsParams): Promise<HotspotRanking[]> {
  // Approximate degree conversion for kilometers
  // 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 * cos(latitude) km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const { data, error } = await supabase
    .from('hotspot_rankings')
    .select('*')
    .gte('latitude', lat - latDelta)
    .lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta)
    .lte('longitude', lng + lngDelta)
    .order('ranking_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching nearby hotspots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get hotspots commonly used in trips
 * Good for trip planning suggestions
 */
export async function getHotspotsForTripPlanning(limit: number = RANKING_QUERY_CONFIG.DEFAULT_LIMIT): Promise<HotspotRanking[]> {
  const { data, error } = await supabase
    .from('hotspot_rankings')
    .select('*')
    .order('trip_usage_score', { ascending: false })
    .order('ranking_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trip planning hotspots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get hotspots saved by user's travel buddies
 * Used for personalized recommendations
 */
export async function getHotspotsSavedByTravelBuddies({
  userId,
  limit = RANKING_QUERY_CONFIG.DEFAULT_LIMIT
}: TravelBuddyHotspotsParams): Promise<HotspotRanking[]> {
  // First get user's friends/connections
  const { data: friends, error: friendsError } = await supabase
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', userId)
    .eq('status', 'accepted');

  if (friendsError) {
    console.error('Error fetching friends:', friendsError);
    throw friendsError;
  }

  if (!friends || friends.length === 0) {
    return [];
  }

  const friendIds = friends.map(f => f.followed_id);

  // Get hotspots saved by friends
  const { data: savedHotspotIds, error: savesError } = await supabase
    .from('hotspot_saves')
    .select('hotspot_id')
    .in('user_id', friendIds);

  if (savesError) {
    console.error('Error fetching friend saves:', savesError);
    throw savesError;
  }

  if (!savedHotspotIds || savedHotspotIds.length === 0) {
    return [];
  }

  const uniqueHotspotIds = [...new Set(savedHotspotIds.map(s => s.hotspot_id))];

  // Get ranking data for these hotspots
  const { data, error } = await supabase
    .from('hotspot_rankings')
    .select('*')
    .in('hotspot_id', uniqueHotspotIds)
    .order('social_score', { ascending: false })
    .order('ranking_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching travel buddy hotspots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get personalized recommendations based on user activity
 * Combines multiple signals for personalized feed
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = RANKING_QUERY_CONFIG.DEFAULT_LIMIT
): Promise<HotspotRanking[]> {
  // Get user's saved hotspots to understand preferences
  const { data: savedHotspots } = await supabase
    .from('hotspot_saves')
    .select('hotspot_id, hotspots(category)')
    .eq('user_id', userId)
    .limit(20);

  // Get user's trip stops to understand travel patterns
  const { data: tripStops } = await supabase
    .from('trip_stops')
    .select('hotspot_id, hotspots(province)')
    .limit(20);

  // For now, return top ranked hotspots
  // In production, this would use collaborative filtering or ML
  return getTopHotspots(limit);
}

/**
 * Refresh the materialized view (admin function)
 * Called by scheduled job or manually
 */
export async function refreshRankings(): Promise<void> {
  const { error } = await supabase.rpc('refresh_hotspot_rankings');
  
  if (error) {
    console.error('Error refreshing rankings:', error);
    throw error;
  }
}

/**
 * Get ranking weights from database (for dynamic tuning)
 */
export async function getRankingWeightsFromDb(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('ranking_weights')
    .select('signal_name, weight')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching ranking weights:', error);
    // Fall back to constants
    return {};
  }

  const weights: Record<string, number> = {};
  data?.forEach(row => {
    weights[row.signal_name] = row.weight;
  });

  return weights;
}

/**
 * Format hotspot ranking for display
 */
export function formatHotspotForDisplay(ranking: HotspotRanking) {
  return {
    id: ranking.hotspot_id,
    name: ranking.hotspot_name,
    lat: ranking.latitude,
    lng: ranking.longitude,
    category: ranking.category,
    province: ranking.province,
    description: ranking.description,
    images: ranking.images,
    tags: ranking.tags,
    savesCount: ranking.saves_count,
    viewsCount: ranking.views_count,
    tripVisitsCount: ranking.trip_visits_count,
    createdAt: ranking.created_at,
    scores: {
      overall: ranking.ranking_score,
      popularity: ranking.popularity_score,
      recency: ranking.recency_score,
      quality: ranking.quality_score,
      tripUsage: ranking.trip_usage_score,
      social: ranking.social_score,
    },
  };
}

