/**
 * Concurrency Limiter for Image Requests
 * 
 * Limits the number of concurrent image requests to prevent 429 errors.
 * Uses p-limit to queue requests when limit is reached.
 */

import pLimit from "p-limit";

/**
 * Maximum concurrent image requests allowed.
 * Set to 6 to balance between loading performance and avoiding 429 errors.
 * The OptimizedImage component also has retry logic with exponential backoff
 * to handle rate limiting gracefully.
 */
export const MAX_CONCURRENT_IMAGE_REQUESTS = 6;

/**
 * Creates a concurrency limiter for image requests.
 * 
 * @param limit - Maximum concurrent requests (default: 6)
 * @returns A limited function that enforces concurrency constraints
 */
export function createImageRequestLimiter(
  limit: number = MAX_CONCURRENT_IMAGE_REQUESTS
): <T>(fn: () => Promise<T>) => Promise<T> {
  const limiter = pLimit(limit);
  
  // Return a function that wraps the promise with the limiter
  return async function limited<T>(fn: () => Promise<T>): Promise<T> {
    return limiter(fn);
  };
}

/**
 * Global image request limiter instance.
 * Used across the application to control image request concurrency.
 */
export const limitImageRequests = createImageRequestLimiter(
  MAX_CONCURRENT_IMAGE_REQUESTS
);

/**
 * Batch process multiple image requests with concurrency control.
 * 
 * @param items - Array of items to process
 * @param processor - Function to process each item (must return a Promise)
 * @param limit - Maximum concurrent requests (default: 6)
 * @returns Array of processed results in the same order as input
 */
export async function batchProcessImages<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  limit: number = MAX_CONCURRENT_IMAGE_REQUESTS
): Promise<R[]> {
  const limiter = pLimit(limit);
  
  // Create limited promises for all items
  const limitedPromises = items.map((item) => limiter(() => processor(item)));
  
  // Execute all with Promise.all to maintain order
  return Promise.all(limitedPromises);
}

/**
 * Process images with staggered start to further reduce server load.
 * Adds a small delay between batches.
 * 
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param batchSize - Number of items per batch (default: 6)
 * @param batchDelay - Delay between batches in ms (default: 100)
 * @returns Array of processed results
 */
export async function processImagesWithStagger<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = MAX_CONCURRENT_IMAGE_REQUESTS,
  batchDelay: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await batchProcessImages(batch, processor, batchSize);
    results.push(...batchResults);
    
    // Add delay between batches (except for last batch)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }
  
  return results;
}

export default limitImageRequests;

