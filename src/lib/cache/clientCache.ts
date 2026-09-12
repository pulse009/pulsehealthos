'use client';

/**
 * High-performance In-Memory SWR Client Cache.
 * Provides instant 0ms responses for repeat API fetches across page switches.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    const res = await fetch(url, options);
    return res.json() as Promise<T>;
  }

  const cacheKey = url;
  const now = Date.now();
  const cached = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;

  // Return fresh cached data immediately if within TTL
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // Deduplicate inflight requests to the same URL
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        // If request fails but we have stale cache, return stale cache as fallback
        if (cached) return cached.data;
        throw new Error(`HTTP ${res.status}: Failed to fetch ${url}`);
      }
      const data = (await res.json()) as T;
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function getCachedData<T>(url: string): T | null {
  const cached = memoryCache.get(url) as CacheEntry<T> | undefined;
  return cached ? cached.data : null;
}

export function setCachedData<T>(url: string, data: T): void {
  memoryCache.set(url, { data, timestamp: Date.now() });
}

export function invalidateClientCache(urlPattern?: string | RegExp): void {
  if (!urlPattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (typeof urlPattern === 'string' ? key.includes(urlPattern) : urlPattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}
