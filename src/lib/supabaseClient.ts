import { supabase } from '../lib/supabase';
import { ENV } from '../utils/env';
import { cache, withCache } from '../utils/cache';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(
  operation: () => Promise<T>,
  attempts: number = ENV.API_RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on validation errors
      if (error instanceof ValidationError) {
        throw error;
      }
      
      // Wait before retrying
      if (i < attempts - 1) {
        await sleep(ENV.API_RETRY_DELAY * Math.pow(2, i));
      }
    }
  }
  
  throw lastError!;
}

export const createSupabaseClient = () => {
  return {
    async query<T>(
      operation: () => Promise<{ data: T | null; error: any }>,
      options: {
        cache?: boolean;
        cacheKey?: string;
        retry?: boolean;
      } = {}
    ): Promise<T> {
      const execute = async () => {
        const { data, error } = await operation();
        
        if (error) {
          if (error.code === '23505') {
            throw new DatabaseError('Duplicate entry', error.code, error.details);
          } else if (error.code?.startsWith('22')) {
            throw new ValidationError(error.message, error.details?.column);
          } else {
            throw new DatabaseError(error.message, error.code || 'UNKNOWN', error.details);
          }
        }
        
        if (!data) {
          throw new Error('No data returned from the query');
        }
        
        return data;
      };

      if (options.cache && options.cacheKey) {
        return withCache(options.cacheKey, () => 
          options.retry ? retryOperation(execute) : execute()
        );
      }

      return options.retry ? retryOperation(execute) : execute();
    }
  };
};

export const supabaseClient = createSupabaseClient();