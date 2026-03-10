/**
 * Image Request Cache
 * 
 * Prevents duplicate requests for the same image URL.
 * Uses a Map<string, Promise> pattern to deduplicate simultaneous requests.
 * 
 * This helps prevent 429 (Too Many Requests) errors by eliminating
 * redundant network traffic when multiple components request the same image.
 */

/**
 * Global cache for image fetch promises.
 * Key: image URL
 * Value: Promise that resolves to the image data or error
 */
const imageRequestCache = new Map<string, Promise<unknown>>();

/**
 * Maximum cache size to prevent memory bloat
 */
const MAX_CACHE_SIZE = 500;

/**
 * Get or create a cached request for the given URL.
 * If a request for this URL already exists, returns the existing promise.
 * Otherwise, creates a new request and caches it.
 * 
 * @param url - The image URL to fetch
 * @param fetcher - Function that performs the actual fetch
 * @returns Promise that resolves to the image data
 */
export function getCachedImageRequest<T>(
  url: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if we already have a pending request for this URL
  const existingRequest = imageRequestCache.get(url);
  
  if (existingRequest) {
    // Return existing promise to prevent duplicate requests
    return existingRequest as Promise<T>;
  }
  
  // Create new request and cache it
  const requestPromise = fetcher().finally(() => {
    // Clean up from cache after completion (success or failure)
    // This allows future requests for the same URL
    imageRequestCache.delete(url);
  });
  
  // Enforce cache size limit
  if (imageRequestCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key in Map)
    const firstKey = imageRequestCache.keys().next().value;
    if (firstKey) {
      imageRequestCache.delete(firstKey);
    }
  }
  
  imageRequestCache.set(url, requestPromise);
  
  return requestPromise;
}

/**
 * Check if there's a pending request for a given URL
 * 
 * @param url - The image URL to check
 * @returns true if there's a pending request
 */
export function hasPendingRequest(url: string): boolean {
  return imageRequestCache.has(url);
}

/**
 * Clear all cached requests
 * Useful for testing or when user session changes
 */
export function clearImageRequestCache(): void {
  imageRequestCache.clear();
}

/**
 * Get current cache size
 * Useful for debugging and monitoring
 */
export function getImageRequestCacheSize(): number {
  return imageRequestCache.size;
}

export default imageRequestCache;

