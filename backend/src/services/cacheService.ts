/**
 * Unified In-Memory Cache Service with Request De-duplication and Stale-While-Revalidate Fallback
 * 
 * Provides:
 * - Configurable TTL per data category via environment variables
 * - Global cache sharing across all concurrent users
 * - Promise de-duplication (collapses multiple concurrent outbound requests for the same key into 1)
 * - Safe stale fallback when providers experience transient rate limits (429) or outages (5xx)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

// Configurable TTLs in milliseconds (with sensible conservative defaults)
export const CACHE_CONFIG = {
  // Open-Meteo updates NWP weather runs every 1-3 hours
  WEATHER_TTL_MS: parseInt(process.env.WEATHER_CACHE_TTL_MS || '1800000', 10), // 30 minutes
  
  // RainViewer radar mosaic updates every 10 minutes
  RADAR_TTL_MS: parseInt(process.env.RADAR_CACHE_TTL_MS || '600000', 10), // 10 minutes
  
  // NASA GIBS daily orbital snapshots update once per day (~3-5h latency)
  SATELLITE_TTL_MS: parseInt(process.env.SATELLITE_CACHE_TTL_MS || '21600000', 10), // 6 hours
  
  // Drainage advisory computed from weather & elevation
  ADVISORY_TTL_MS: parseInt(process.env.ADVISORY_CACHE_TTL_MS || '1800000', 10), // 30 minutes
};

class MemoryCacheService {
  private store: Map<string, CacheEntry<any>> = new Map();
  private inFlight: Map<string, Promise<any>> = new Map();

  /**
   * Normalize district keys so 'bengaluru_urban', 'Bengaluru Urban', 'bengaluru-urban'
   * map to the exact same cache slot.
   */
  public normalizeKey(raw: string): string {
    return raw.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  }

  public get<T>(key: string): CacheEntry<T> | undefined {
    return this.store.get(this.normalizeKey(key));
  }

  public set<T>(key: string, data: T, ttlMs: number, etag?: string): void {
    const normKey = this.normalizeKey(key);
    const now = Date.now();
    this.store.set(normKey, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
      etag
    });
  }

  public delete(key: string): void {
    this.store.delete(this.normalizeKey(key));
  }

  public clear(): void {
    this.store.clear();
  }

  /**
   * Fetches data with in-memory caching and in-flight request de-duplication.
   * If the provider fails, returns stale cached data if available rather than erroring out.
   */
  public async fetchWithCache<T>(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<{ data: T; isCached: boolean; isStale: boolean; lastUpdated: string }> {
    const normKey = this.normalizeKey(key);
    const existing = this.store.get(normKey);
    const now = Date.now();

    // 1. Fresh cache hit
    if (!options?.forceRefresh && existing && now < existing.expiresAt) {
      return {
        data: existing.data,
        isCached: true,
        isStale: false,
        lastUpdated: new Date(existing.timestamp).toISOString()
      };
    }

    // 2. In-flight request de-duplication: reuse in-progress promise
    if (this.inFlight.has(normKey)) {
      const data = await this.inFlight.get(normKey);
      const updated = this.store.get(normKey);
      return {
        data,
        isCached: true,
        isStale: false,
        lastUpdated: new Date(updated ? updated.timestamp : now).toISOString()
      };
    }

    // 3. Initiate fetcher and record in-flight promise
    const fetchPromise = (async () => {
      try {
        const freshData = await fetcher();
        this.set(normKey, freshData, ttlMs);
        return freshData;
      } catch (err: any) {
        // If an error occurs (rate limit 429, provider 5xx, or network failure),
        // gracefully fall back to stale cache if we have previous data
        if (existing) {
          console.warn(`[CacheService] Provider error for "${normKey}" (${err.message}). Serving stale cache.`);
          return existing.data;
        }
        throw err;
      } finally {
        this.inFlight.delete(normKey);
      }
    })();

    this.inFlight.set(normKey, fetchPromise);

    try {
      const resultData = await fetchPromise;
      const cached = this.store.get(normKey);
      const isStale = existing ? (cached?.data === existing.data && now >= existing.expiresAt) : false;
      return {
        data: resultData,
        isCached: Boolean(existing),
        isStale,
        lastUpdated: new Date(cached ? cached.timestamp : now).toISOString()
      };
    } catch (err) {
      throw err;
    }
  }
}

export const cacheService = new MemoryCacheService();
