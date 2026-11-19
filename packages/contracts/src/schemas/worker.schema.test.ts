import { describe, expect, it } from 'vitest';
import { parseWorker, WorkerSchema } from './worker.schema';

const VALID_WORKER = {
  id: '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1',
  tenantId: 'd44c72ee-0000-4000-8000-000000000001',
  projectId: null,
  code: 'VN123',
  fullName: 'Nguyen Van A',
  phoneNumber: '0912345678',
  status: 'ACTIVE',
};

describe('WorkerSchema', () => {
  it('parses a valid worker payload', () => {
    expect(parseWorker(VALID_WORKER)).toEqual(VALID_WORKER);
  });

  it('rejects a payload missing the tenant boundary', () => {
    const { tenantId: _tenantId, ...missing } = VALID_WORKER;
    expect(WorkerSchema.safeParse(missing).success).toBe(false);
  });

  it('rejects a lowercase worker code', () => {
    expect(WorkerSchema.safeParse({ ...VALID_WORKER, code: 'vn123' }).success).toBe(false);
  });

  it('rejects undefined extra keys because of strict mode', () => {
    const withExtra = { ...VALID_WORKER, extra: 'leak' };
    expect(WorkerSchema.safeParse(withExtra).success).toBe(false);
  });
});
