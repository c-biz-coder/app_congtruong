import type { SyncCursor } from '@partner-os/sync-engine';
import type { CursorStore } from './sync-runtime';
import type { SecureStoreApi } from '../auth/chunked-secure-storage';

const CURSOR_KEY_PREFIX = 'sync';

/** Each tenant + record type keeps its own pull cursor so switching tenants never reuses another tenant's position. */
export function cursorKeyForTenant(tenantId: string, recordType = 'worker'): string {
  return `${CURSOR_KEY_PREFIX}.${recordType}.cursor.${tenantId}`;
}

export function createSecureCursorStore(
  store: SecureStoreApi,
  tenantId: string,
  recordType = 'worker',
): CursorStore {
  const key = cursorKeyForTenant(tenantId, recordType);
  return {
    async read() {
      return (await store.getItemAsync(key)) as SyncCursor | null;
    },
    async write(cursor) {
      await store.setItemAsync(key, cursor);
    },
  };
}
