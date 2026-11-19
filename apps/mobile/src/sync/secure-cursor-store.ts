import type { SyncCursor } from '@partner-os/sync-engine';
import type { CursorStore } from './sync-runtime';
import type { SecureStoreApi } from '../auth/chunked-secure-storage';

const CURSOR_KEY = 'sync.worker.cursor';

export function createSecureCursorStore(store: SecureStoreApi): CursorStore {
  return {
    async read() {
      return (await store.getItemAsync(CURSOR_KEY)) as SyncCursor | null;
    },
    async write(cursor) {
      await store.setItemAsync(CURSOR_KEY, cursor);
    },
  };
}
