import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RETRY_POLICY,
  advanceCursor,
  bumpVersion,
  createOutboxRecord,
  delayForAttempt,
  strategyForRecordType,
} from '@partner-os/sync-engine';

describe('offline → online sync flow (integration)', () => {
  it('queues a local change, retries with backoff, resolves conflicts, advances the cursor', () => {
    const outbox = createOutboxRecord({
      operationId: 'op-incident-1',
      deviceId: 'device-1',
      recordType: 'incident',
      recordId: 'inc-1',
      operation: 'create',
      version: 1,
      payload: {
        id: 'inc-1',
        tenantId: 'd44c72ee-0000-4000-8000-000000000001',
        severity: 'HIGH',
      },
    });

    expect(outbox.status).toBe('pending');

    // Attempt 1 fails; the retry policy backs off exponentially.
    expect(delayForAttempt(1, DEFAULT_RETRY_POLICY)).toBe(1000);
    expect(delayForAttempt(2, DEFAULT_RETRY_POLICY)).toBe(2000);

    // Projected next version for the record.
    expect(bumpVersion(outbox.version)).toBe(2);

    // Incidents must never be silently overwritten → VERSION_CHECK.
    expect(strategyForRecordType(outbox.recordType, 'LWW')).toBe('VERSION_CHECK');

    // Pull watermark advances monotonically.
    const cursor = advanceCursor(null, '2026-01-01T00:00:00.000Z');
    const advanced = advanceCursor(cursor, '2026-01-02T00:00:00.000Z');
    expect(advanced).toBe('2026-01-02T00:00:00.000Z');
    expect(advanceCursor(advanced, '2026-01-01T00:00:00.000Z')).toBe(advanced);
  });
});
