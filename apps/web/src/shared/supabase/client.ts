import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readWebEnv } from '../config/env';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to use this screen.',
    );
    this.name = 'SupabaseNotConfiguredError';
  }
}

let cachedClient: SupabaseClient | null = null;

/**
 * Lazy singleton. Throws only when a feature actually needs the network,
 * never at import time.
 */
export function supabaseClient(env: ImportMetaEnv = import.meta.env): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }
  const config = readWebEnv(env);
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new SupabaseNotConfiguredError();
  }
  cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return cachedClient;
}
