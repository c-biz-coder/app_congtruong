import { describe, expect, it } from 'vitest';
import { createChunkedSecureStorage, type SecureStoreApi } from './chunked-secure-storage';

function memoryStore(): SecureStoreApi & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async getItemAsync(key) {
      return data.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      data.set(key, value);
    },
    async deleteItemAsync(key) {
      data.delete(key);
    },
  };
}

describe('createChunkedSecureStorage', () => {
  it('round-trips a value larger than one SecureStore chunk', async () => {
    const store = memoryStore();
    const storage = createChunkedSecureStorage(store);
    const session = 'x'.repeat(4000);

    await storage.setItem('sb-auth-token', session);

    expect(await storage.getItem('sb-auth-token')).toBe(session);
    expect(store.data.get('sb-auth-token.count')).toBe('3');
  });

  it('removes stale chunks when a shorter value replaces a longer one', async () => {
    const store = memoryStore();
    const storage = createChunkedSecureStorage(store);

    await storage.setItem('sb-auth-token', 'y'.repeat(4000));
    await storage.setItem('sb-auth-token', 'short');

    expect(await storage.getItem('sb-auth-token')).toBe('short');
    expect(store.data.has('sb-auth-token.1')).toBe(false);
    expect(store.data.has('sb-auth-token.2')).toBe(false);
  });

  it('returns null after removal', async () => {
    const store = memoryStore();
    const storage = createChunkedSecureStorage(store);

    await storage.setItem('sb-auth-token', 'value');
    await storage.removeItem('sb-auth-token');

    expect(await storage.getItem('sb-auth-token')).toBeNull();
    expect(store.data.size).toBe(0);
  });
});
