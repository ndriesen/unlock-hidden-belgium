import { get, set, del, clear } from 'idb-keyval';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // ms
}

export class IndexedDbCache {
  private static instance: IndexedDbCache;
  private prefix = 'spotly-cache-';

  static getInstance(): IndexedDbCache {
    if (!IndexedDbCache.instance) {
      IndexedDbCache.instance = new IndexedDbCache();
    }
    return IndexedDbCache.instance;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const entry = await get<CacheEntry<T>>(this.getKey(key));
      if (!entry) return undefined;
      
      const now = Date.now();
      if (now > entry.timestamp + entry.ttl) {
        await this.del(key);
        return undefined;
      }

      return entry.data;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return undefined;
    }
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      await set(this.getKey(key), entry);
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await del(this.getKey(key));
    } catch (error) {
      console.error('IndexedDB del error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await clear();
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}

// TTL presets (from task)
export const TTL = {
  locations: 10 * 60 * 1000, // 10min
  details: 24 * 60 * 60 * 1000, // 24h
  images: 7 * 24 * 60 * 60 * 1000, // 7d
} as const;

export default IndexedDbCache;
