import { ENV } from './env';

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private ttl: number;

  constructor(ttl = ENV.CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new Cache();

export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  if (!ENV.ENABLE_CACHE) {
    return fn();
  }

  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  const result = await fn();
  cache.set(key, result);
  return result;
};