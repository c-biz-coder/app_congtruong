import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography } from '@partner-os/ui';
import { createLocalWorkerRepository, WorkersListPage } from '../features/workers';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { createWatermelonDatabase } from '../database';
import { readMobileEnv } from '../shared/config/env';
import { createChunkedSecureStorage } from '../auth/chunked-secure-storage';
import {
  bindAutoRefresh,
  createMobileSupabaseClient,
  signInWithPassword,
  useSession,
} from '../auth/session';
import { createSupabaseSyncTransport } from '../sync/supabase-sync-transport';
import { createWorkerSyncRuntime } from '../sync/sync-runtime';
import { createSecureCursorStore } from '../sync/secure-cursor-store';
import { useAutoSync } from '../sync/use-auto-sync';

const mobileEnv = readMobileEnv({
  EXPO_PUBLIC_DEVICE_ID: process.env.EXPO_PUBLIC_DEVICE_ID,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
});
const localDatabase = createWatermelonDatabase();
const workerRepository = createLocalWorkerRepository(localDatabase, mobileEnv.deviceId);

const isConfigured = mobileEnv.supabaseUrl !== '' && mobileEnv.supabaseAnonKey !== '';
const supabase = isConfigured
  ? createMobileSupabaseClient(
      { supabaseUrl: mobileEnv.supabaseUrl, supabaseAnonKey: mobileEnv.supabaseAnonKey },
      createChunkedSecureStorage(SecureStore),
    )
  : null;
const syncRuntime = supabase
  ? createWorkerSyncRuntime({
      outbox: localDatabase.outbox,
      workers: localDatabase.workers,
      transport: createSupabaseSyncTransport(supabase),
      cursorStore: createSecureCursorStore(SecureStore),
    })
  : null;

export default function App(): React.JSX.Element {
  const session = useSession(supabase);

  useEffect(() => {
    if (!supabase) return;
    return bindAutoRefresh(supabase);
  }, []);

  useAutoSync(session.status === 'signed-in' && syncRuntime ? syncRuntime.syncNow : null);

  if (!supabase) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Thiếu cấu hình EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY.
        </Text>
      </View>
    );
  }

  if (session.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (session.status === 'signed-out') {
    return (
      <LoginPage onSignIn={(email, password) => signInWithPassword(supabase, email, password)} />
    );
  }

  return <WorkersListPage repository={workerRepository} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.neutral.white,
  },
  message: {
    color: colors.neutral.gray,
    fontSize: typography.size.md,
    textAlign: 'center',
  },
});
