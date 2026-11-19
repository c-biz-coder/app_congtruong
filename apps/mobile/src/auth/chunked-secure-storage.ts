/** The subset of expo-secure-store used for session and cursor persistence. */
export interface SecureStoreApi {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/**
 * expo-secure-store caps each value at 2048 bytes, but a Supabase session is
 * larger, so it is split into numbered chunks under one logical key.
 */
const CHUNK_SIZE = 1800;

const countKey = (key: string): string => `${key}.count`;
const chunkKey = (key: string, index: number): string => `${key}.${index}`;

export interface ChunkedStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createChunkedSecureStorage(store: SecureStoreApi): ChunkedStorage {
  async function storedCount(key: string): Promise<number> {
    const raw = await store.getItemAsync(countKey(key));
    return raw === null ? 0 : Number(raw);
  }

  return {
    async getItem(key) {
      const count = await storedCount(key);
      if (count === 0) return null;
      const parts: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const part = await store.getItemAsync(chunkKey(key, index));
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    },

    async setItem(key, value) {
      const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [];
      const previous = await storedCount(key);
      for (let index = 0; index < chunks.length; index += 1) {
        await store.setItemAsync(chunkKey(key, index), chunks[index]!);
      }
      await store.setItemAsync(countKey(key), String(chunks.length));
      for (let index = chunks.length; index < previous; index += 1) {
        await store.deleteItemAsync(chunkKey(key, index));
      }
    },

    async removeItem(key) {
      const count = await storedCount(key);
      for (let index = 0; index < count; index += 1) {
        await store.deleteItemAsync(chunkKey(key, index));
      }
      await store.deleteItemAsync(countKey(key));
    },
  };
}
