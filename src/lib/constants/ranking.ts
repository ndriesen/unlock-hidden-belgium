/**
 * Hotspot Ranking Engine Constants
 * 
 * These weights determine how different signals contribute to the final ranking score.
 * They can be tuned to adjust the ranking algorithm's behavior.
 */

// =============================================================================
// WEIGHT CONFIGURATION - Sum must equal 1.0
// =============================================================================

/**
 * Signal weights for the final ranking formula:
 * ranking_score =
 *   (popularity_score * 0.30)
 *   + (recency_score * 0.20)
 *   + (quality_score * 0.15)
 *   + (trip_usage_score * 0.20)
 *   + (social_score * 0.15)
 */
export const RANKING_WEIGHTS = {
  /** Weight for popularity signals (saves + views) - Default: 0.30 */
  POPULARITY: 0.30,
  
  /** Weight for recency signal - Default: 0.20 */
  RECENCY: 0.20,
  
  /** Weight for content quality signals - Default: 0.15 */
  QUALITY: 0.15,
  
  /** Weight for trip usage signals - Default: 0.20 */
  TRIP_USAGE: 0.20,
  
  /** Weight for social signals - Default: 0.15 */
  SOCIAL: 0.15,
} as const;

// =============================================================================
// POPULARITY SCORE CONFIGURATION
// =============================================================================

/**
 * Popularity score formula:
 * (LOG(saves_count + 1) * 0.6) + (LOG(views_count + 1) * 0.4)
 */
export const POPULARITY_CONFIG = {
  /** Weight of saves in popularity calculation - Default: 0.6 */
  SAVES_WEIGHT: 0.6,
  
  /** Weight of views in popularity calculation - Default: 0.4 */
  VIEWS_WEIGHT: 0.4,
} as const;

// =============================================================================
// QUALITY SCORE CONFIGURATION
// =============================================================================

/**
 * Quality score formula:
 * description_score + image_score + tag_score
 * 
 * - description_score: +0.4 if description length > 200
 * - image_score: +0.3 if images exist
 * - tag_score: +0.3 if tags exist
 */
export const QUALITY_CONFIG = {
  /** Points for having a description > 200 characters */
  DESCRIPTION_THRESHOLD: 200,
  DESCRIPTION_POINTS: 0.4,
  
  /** Points for having at least one image */
  IMAGE_POINTS: 0.3,
  
  /** Points for having at least one tag */
  TAG_POINTS: 0.3,
} as const;

// =============================================================================
// RECENCY SCORE CONFIGURATION
// =============================================================================

/**
 * Recency score formula:
 * 1 / (1 + (days_since_creation / 30))
 * 
 * This gives newer hotspots a boost that decays over time.
 * After 30 days, the recency score is approximately 0.5
 * After 60 days, it's approximately 0.33
 */
export const RECENCY_CONFIG = {
  /** Days over which recency decays - Default: 30 days */
  DECAY_DAYS: 30,
} as const;

// =============================================================================
// TRIP USAGE SCORE CONFIGURATION
// =============================================================================

/**
 * Trip usage score formula:
 * LOG(number_of_trip_stops + 1)
 * 
 * Uses logarithmic scale to prevent very popular spots from dominating
 */
export const TRIP_USAGE_CONFIG = {
  /** Base for logarithm - natural log is used */
  LOG_BASE: Math.E,
} as const;

// =============================================================================
// SOCIAL SCORE CONFIGURATION
// =============================================================================

/**
 * Social score formula:
 * LOG(number_of_unique_users_saved + 1)
 * 
 * Uses logarithmic scale to reward hotspots saved by multiple users
 */
export const SOCIAL_CONFIG = {
  /** Base for logarithm - natural log is used */
  LOG_BASE: Math.E,
} as const;

// =============================================================================
// QUERY CONFIGURATION
// =============================================================================

export const RANKING_QUERY_CONFIG = {
  /** Default number of hotspots to return */
  DEFAULT_LIMIT: 20,
  
  /** Maximum number of hotspots to return */
  MAX_LIMIT: 100,
  
  /** Nearby search radius in kilometers */
  NEARBY_RADIUS_KM: 50,
  
  /** Refresh interval for materialized view in minutes */
  MATERIALIZED_VIEW_REFRESH_MINUTES: 10,
} as const;

// =============================================================================
// ACTIVITY TYPES
// =============================================================================

/**
 * Activity types tracked for ranking signals
 */
export const ACTIVITY_TYPES = {
  VIEW_HOTSPOT: 'view_hotspot',
  OPEN_HOTSPOT: 'open_hotspot',
  SAVE_HOTSPOT: 'save_hotspot',
  UNSAVE_HOTSPOT: 'unsave_hotspot',
  ADD_HOTSPOT_TO_TRIP: 'add_hotspot_to_trip',
  VISIT_HOTSPOT: 'visit_hotspot',
  CREATE_HOTSPOT: 'create_hotspot',
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export type RankingWeightKey = keyof typeof RANKING_WEIGHTS;

/**
 * Get the weight value for a given signal
 */
export function getRankingWeight(key: RankingWeightKey): number {
  return RANKING_WEIGHTS[key];
}

/**
 * Validate that weights sum to 1.0
 */
export function validateRankingWeights(): boolean {
  const sum = 
    RANKING_WEIGHTS.POPULARITY +
    RANKING_WEIGHTS.RECENCY +
    RANKING_WEIGHTS.QUALITY +
    RANKING_WEIGHTS.TRIP_USAGE +
    RANKING_WEIGHTS.SOCIAL;
  
  return Math.abs(sum - 1.0) < 0.001;
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  if (!validateRankingWeights()) {
    console.error('Ranking weights do not sum to 1.0!');
  }
}

