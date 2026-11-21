import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography } from '@partner-os/ui';
import { createLocalWorkerRepository, WorkersListPage } from '../features/workers';
import { createLocalAttendanceRepository, AttendanceListPage } from '../features/attendance';
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
import { createSupabaseAttendanceTransport } from '../sync/supabase-attendance-transport';
import { createWorkerSyncRuntime, createAttendanceSyncRuntime } from '../sync/sync-runtime';
import { createSecureCursorStore } from '../sync/secure-cursor-store';
import { useAutoSync } from '../sync/use-auto-sync';
import { getActiveTenantId, listMyTenants, type TenantMembership } from '../auth/memberships';
import { TenantSwitcher } from '../auth/TenantSwitcher';

const mobileEnv = readMobileEnv({
  EXPO_PUBLIC_DEVICE_ID: process.env.EXPO_PUBLIC_DEVICE_ID,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
});
const localDatabase = createWatermelonDatabase();
const workerRepository = createLocalWorkerRepository(localDatabase, mobileEnv.deviceId);
const attendanceRepository = createLocalAttendanceRepository(localDatabase, mobileEnv.deviceId);

const isConfigured = mobileEnv.supabaseUrl !== '' && mobileEnv.supabaseAnonKey !== '';
const supabase = isConfigured
  ? createMobileSupabaseClient(
      { supabaseUrl: mobileEnv.supabaseUrl, supabaseAnonKey: mobileEnv.supabaseAnonKey },
      createChunkedSecureStorage(SecureStore),
    )
  : null;
const syncOutbox = localDatabase.outbox;

export default function App(): React.JSX.Element {
  const session = useSession(supabase);
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    return bindAutoRefresh(supabase);
  }, []);

  useEffect(() => {
    if (!supabase || session.status !== 'signed-in') {
      setTenants([]);
      setActiveTenantId(null);
      return;
    }
    let active = true;
    void Promise.all([listMyTenants(supabase), getActiveTenantId(supabase)])
      .then(([list, dbActive]) => {
        if (!active) return;
        setTenants(list);
        // Membership is re-read from the database. A tenant no longer listed is revoked.
        const resolved = dbActive && list.some((t) => t.tenantId === dbActive) ? dbActive : null;
        setActiveTenantId(resolved);
        setAccessError(list.length === 0 || resolved === null ? 'Tài khoản chưa có quyền truy cập đơn vị nào.' : null);
      })
      .catch((unexpected: unknown) => {
        if (!active) return;
        setTenants([]);
        setActiveTenantId(null);
        setAccessError(unexpected instanceof Error ? unexpected.message : String(unexpected));
      });
    return () => {
      active = false;
    };
  }, [session.status]);

  const workerSyncRuntime = useMemo(
    () =>
      supabase && activeTenantId
        ? createWorkerSyncRuntime({
            outbox: syncOutbox,
            workers: localDatabase.workers,
            transport: createSupabaseSyncTransport(supabase),
            cursorStore: createSecureCursorStore(SecureStore, activeTenantId, 'worker'),
          })
        : null,
    [activeTenantId],
  );

  const attendanceSyncRuntime = useMemo(
    () =>
      supabase && activeTenantId
        ? createAttendanceSyncRuntime({
            outbox: syncOutbox,
            attendance: localDatabase.attendance,
            transport: createSupabaseAttendanceTransport(supabase),
            cursorStore: createSecureCursorStore(SecureStore, activeTenantId, 'attendance'),
          })
        : null,
    [activeTenantId],
  );

  const syncNow = useMemo(() => {
    const runtimes = [workerSyncRuntime, attendanceSyncRuntime].filter(
      (runtime): runtime is NonNullable<typeof runtime> => runtime !== null,
    );
    if (runtimes.length === 0) return null;
    return async () => {
      await Promise.all(runtimes.map((runtime) => runtime.syncNow()));
    };
  }, [workerSyncRuntime, attendanceSyncRuntime]);

  useAutoSync(session.status === 'signed-in' && syncNow ? syncNow : null);

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

  if (accessError || !activeTenantId || !supabase) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{accessError ?? 'Đang xác định đơn vị làm việc.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TenantSwitcher
        client={supabase}
        outbox={syncOutbox}
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSwitched={setActiveTenantId}
        onSyncNow={syncNow ?? (async () => undefined)}
      />
      <WorkersListPage repository={workerRepository} tenantId={activeTenantId} />
      <AttendanceListPage repository={attendanceRepository} tenantId={activeTenantId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
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
