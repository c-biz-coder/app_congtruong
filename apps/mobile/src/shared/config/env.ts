export interface MobileEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  deviceId: string;
}

/** Read Expo public env variables (EXPO_PUBLIC_*). Single access point. */
export function readMobileEnv(env: Record<string, string | undefined>): MobileEnv {
  return {
    supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    deviceId: env.EXPO_PUBLIC_DEVICE_ID ?? '',
  };
}
