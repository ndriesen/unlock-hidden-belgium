/**
 * Security utilities for query field restrictions and API responses
 * Prevents over-fetching and ensures only necessary data is returned
 */

/**
 * Whitelist of allowed fields for user queries
 */
export const ALLOWED_USER_FIELDS = [
  'id',
  'username',
  'email',
  'xp_points',
  'city',
  'travel_style',
  'interests',
  'availability',
  'bio',
  'avatar_url',
  'is_admin',
  'created_at',
  'updated_at'
] as const;

/**
 * Whitelist of allowed fields for hotspot queries
 */
export const ALLOWED_HOTSPOT_FIELDS = [
  'id',
  'name',
  'category',
  'province',
  'description',
  'latitude',
  'longitude',
  'images',
  'visit_count',
  'likes_count',
  'saves_count',
  'status',
  'created_at',
  'updated_at'
] as const;

/**
 * Whitelist of allowed fields for review queries
 */
export const ALLOWED_REVIEW_FIELDS = [
  'id',
  'hotspot_id',
  'user_id',
  'rating',
  'comment',
  'visibility',
  'created_at',
  'updated_at'
] as const;

/**
 * Whitelist of allowed fields for activity queries
 */
export const ALLOWED_ACTIVITY_FIELDS = [
  'id',
  'actor_id',
  'activity_type',
  'entity_type',
  'entity_id',
  'message',
  'metadata',
  'visibility',
  'created_at'
] as const;

/**
 * Whitelist of allowed fields for trip queries
 */
export const ALLOWED_TRIP_FIELDS = [
  'id',
  'title',
  'description',
  'cover_image',
  'likes_count',
  'saves_count',
  'views_count',
  'created_by',
  'visibility',
  'created_at',
  'updated_at'
] as const;

type AllowedField<T extends readonly string[]> = T[number];

/**
 * Filter an object to only include allowed fields
 * Prevents accidental data exposure through extra fields
 */
export function filterAllowedFields<T extends readonly string[]>(
  obj: Record<string, unknown>,
  allowedFields: T
): Record<AllowedField<T>, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      result[field] = obj[field];
    }
  }
  
  return result as Record<AllowedField<T>, unknown>;
}

/**
 * Sanitize string input to prevent injection
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate that a string matches an allowed pattern
 */
export function validateField(value: unknown, allowedFields: readonly string[]): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return allowedFields.includes(value);
}

/**
 * Create a safe API response that only includes allowed fields
 */
export function createSafeResponse<T extends Record<string, unknown>>(
  data: T,
  allowedFields: readonly string[]
): Record<string, unknown> {
  return filterAllowedFields(data, allowedFields);
}

/**
 * Create an API error response with minimal information
 */
export function createErrorResponse(message = 'An error occurred'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      // Prevent caching of error responses
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(message = 'Resource not found'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create a forbidden response
 */
export function createForbiddenResponse(message = 'Forbidden'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

