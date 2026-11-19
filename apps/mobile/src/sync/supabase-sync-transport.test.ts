import type { SupabaseClient } from '@supabase/supabase-js';
import type { OutboxRecord } from '@partner-os/sync-engine';
import { describe, expect, it, vi } from 'vitest';
import { createSupabaseSyncTransport } from './supabase-sync-transport';

const WORKER = {
  id: '11111111-1111-4111-8111-111111111111',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: null,
  code: 'W001',
  fullName: 'Nguyen Van A',
  phoneNumber: '0900000000',
  status: 'ACTIVE',
};

function outboxRecord(overrides: Partial<OutboxRecord<unknown>> = {}): OutboxRecord<unknown> {
  return {
    operationId: 'op-1',
    deviceId: 'device-1',
    recordType: 'worker',
    recordId: WORKER.id,
    operation: 'create',
    payload: WORKER,
    version: 1,
    clientTimestamp: '2026-01-01T00:00:00.000Z',
    retryCount: 0,
    lastError: null,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Builder stub: every filter returns the same chain; terminal calls resolve `result`. */
function fakeClient(result: { data: unknown; error: { code?: string; message?: string } | null }) {
  const chain: Record<string, unknown> = {};
  for (const method of ['insert', 'update', 'select', 'eq', 'gt', 'order']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.limit = vi.fn(async () => result);
  const from = vi.fn(() => chain);
  return { client: { from } as unknown as SupabaseClient, chain, from };
}

describe('createSupabaseSyncTransport', () => {
  it('reports a duplicate-key insert as a conflict instead of throwing', async () => {
    const { client } = fakeClient({ data: null, error: { code: '23505', message: 'duplicate' } });
    const result = await createSupabaseSyncTransport(client).push('op-1', outboxRecord());
    expect(result.acknowledged).toBe(false);
  });

  it('acknowledges an update only when the server still holds the previous version', async () => {
    const { client, chain } = fakeClient({ data: null, error: null });
    const result = await createSupabaseSyncTransport(client).push(
      'op-2',
      outboxRecord({ operation: 'update', version: 3 }),
    );

    expect(result.acknowledged).toBe(false);
    expect(chain.eq).toHaveBeenCalledWith('version', 2);
  });

  it('rejects record types it does not sync yet', async () => {
    const { client } = fakeClient({ data: null, error: null });
    await expect(
      createSupabaseSyncTransport(client).push('op-3', outboxRecord({ recordType: 'incident' })),
    ).rejects.toThrow('Unsupported record type');
  });

  it('advances the pull cursor to the last returned updated_at and keeps it when empty', async () => {
    const rows = [
      { id: WORKER.id, tenant_id: WORKER.tenantId, project_id: null, code: 'W001', full_name: 'A', phone_number: '1', status: 'ACTIVE', version: 2, updated_at: '2026-01-05T00:00:00.000Z', deleted_at: null },
    ];
    const withRows = fakeClient({ data: rows, error: null });
    const batch = await createSupabaseSyncTransport(withRows.client).pull({ cursor: '2026-01-01T00:00:00.000Z' });
    expect(batch.cursor).toBe('2026-01-05T00:00:00.000Z');
    expect(batch.records[0]).toMatchObject({ recordId: WORKER.id, version: 2 });
    expect(withRows.chain.gt).toHaveBeenCalledWith('updated_at', '2026-01-01T00:00:00.000Z');

    const empty = fakeClient({ data: [], error: null });
    const same = await createSupabaseSyncTransport(empty.client).pull({ cursor: '2026-02-01T00:00:00.000Z' });
    expect(same.cursor).toBe('2026-02-01T00:00:00.000Z');
  });
});
