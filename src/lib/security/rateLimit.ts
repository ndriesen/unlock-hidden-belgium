/**
 * Simple in-memory rate limiter for authentication endpoints
 * Note: For production, use Redis or Supabase Edge Functions with rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit configurations
const RATE_LIMITS = {
  // Auth endpoints: 5 attempts per 15 minutes per IP
  auth: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  // API endpoints: 100 requests per minute per user
  api: { maxAttempts: 100, windowMs: 60 * 1000 },
  // Hotspot creation: 10 per hour per user
  hotspotCreate: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
};

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request should be rate limited
 * @param key - Unique identifier (IP address or user ID)
 * @param type - Type of rate limit to apply
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(key: string, type: keyof typeof RATE_LIMITS = 'api'): boolean {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }
  
  if (entry.count >= config.maxAttempts) {
    // Rate limited
    return true;
  }
  
  // Increment count
  entry.count++;
  return false;
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests(key: string, type: keyof typeof RATE_LIMITS = 'api'): number {
  const config = RATE_LIMITS[type];
  const entry = rateLimitStore.get(key);
  
  if (!entry || Date.now() > entry.resetTime) {
    return config.maxAttempts;
  }
  
  return Math.max(0, config.maxAttempts - entry.count);
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

