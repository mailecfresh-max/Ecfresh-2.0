type EnvVar = {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
};

const ENV_VARS: EnvVar[] = [
  { name: 'VITE_SUPABASE_URL', required: true, type: 'string' },
  { name: 'VITE_SUPABASE_ANON_KEY', required: true, type: 'string' },
  { name: 'VITE_API_TIMEOUT', required: false, type: 'number' },
  { name: 'VITE_API_RETRY_ATTEMPTS', required: false, type: 'number' },
  { name: 'VITE_API_RETRY_DELAY', required: false, type: 'number' },
  { name: 'VITE_CACHE_TTL', required: false, type: 'number' },
  { name: 'VITE_ENABLE_CACHE', required: false, type: 'boolean' },
];

export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  API_RETRY_ATTEMPTS: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
  API_RETRY_DELAY: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000,
  CACHE_TTL: Number(import.meta.env.VITE_CACHE_TTL) || 300000,
  ENABLE_CACHE: import.meta.env.VITE_ENABLE_CACHE === 'true',
} as const;

export const validateEnv = (): void => {
  const errors: string[] = [];

  ENV_VARS.forEach((v) => {
    const value = import.meta.env[v.name];
    
    if (v.required && !value) {
      errors.push(`Missing required environment variable: ${v.name}`);
      return;
    }

    if (value) {
      if (v.type === 'number' && isNaN(Number(value))) {
        errors.push(`Environment variable ${v.name} must be a number`);
      } else if (v.type === 'boolean' && !['true', 'false'].includes(value)) {
        errors.push(`Environment variable ${v.name} must be a boolean`);
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};