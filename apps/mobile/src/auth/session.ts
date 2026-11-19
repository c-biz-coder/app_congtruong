import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { ChunkedStorage } from './chunked-secure-storage';

export interface MobileAuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function createMobileSupabaseClient(
  config: MobileAuthConfig,
  storage: ChunkedStorage,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

/** Refreshes tokens only while the app is in the foreground. Returns an unsubscribe function. */
export function bindAutoRefresh(client: SupabaseClient): () => void {
  void client.auth.startAutoRefresh();
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void client.auth.startAutoRefresh();
    } else {
      void client.auth.stopAutoRefresh();
    }
  });
  return () => {
    subscription.remove();
    void client.auth.stopAutoRefresh();
  };
}

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw new Error(error.message);
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session };

/**
 * Session gating is local: the persisted session is restored without a
 * network call, so a worker who signed in once can open the app offline.
 */
export function useSession(client: SupabaseClient | null): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    if (!client) {
      setState({ status: 'signed-out' });
      return;
    }
    let active = true;
    const toState = (session: Session | null): SessionState =>
      session ? { status: 'signed-in', session } : { status: 'signed-out' };

    void client.auth.getSession().then(({ data }) => {
      if (active) setState(toState(data.session));
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setState(toState(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  return state;
}
