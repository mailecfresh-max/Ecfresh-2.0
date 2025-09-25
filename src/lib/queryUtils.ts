import { supabase } from './supabase';
import { cache } from '../utils/cache';
import { ENV } from '../utils/env';

type QueryOptions = {
  retry?: boolean;
  cache?: boolean;
  cacheKey?: string;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> {
  const { retries = ENV.API_RETRY_ATTEMPTS, delay = ENV.API_RETRY_DELAY } = options;
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (i < retries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

export async function queryWithOptions<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<T> {
  const execute = async () => {
    const { data, error } = await query();
    
    if (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      const errorDetails = {
        code: error.code,
        details: error.details,
        hint: error.hint
      };
      throw new Error(JSON.stringify({ message: errorMessage, ...errorDetails }));
    }
    
    if (!data) {
      throw new Error('No data returned from the query');
    }
    
    return data;
  };

  // Handle caching
  if (options.cache && options.cacheKey) {
    const cached = cache.get<T>(options.cacheKey);
    if (cached) return cached;
  }

  // Execute query with retry if needed
  const result = options.retry 
    ? await withRetry(execute)
    : await execute();

  // Cache successful results
  if (options.cache && options.cacheKey) {
    cache.set(options.cacheKey, result);
  }

  return result;
}