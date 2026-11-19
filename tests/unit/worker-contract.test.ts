import { describe, expect, it } from 'vitest';
import { WorkerSchema } from '@partner-os/contracts';
import { validateWorkerRecord, type Worker } from '@partner-os/domain';

const worker: Worker = {
  id: '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1',
  tenantId: 'd44c72ee-0000-4000-8000-000000000001',
  projectId: null,
  code: 'VN123',
  fullName: 'Nguyen Van A',
  phoneNumber: '0912345678',
  status: 'ACTIVE',
};

describe('worker: contracts + domain alignment', () => {
  it('accepts a worker that passes both Zod and domain rules', () => {
    const parsed = WorkerSchema.parse(worker);
    expect(() => validateWorkerRecord(parsed)).not.toThrow();
  });

  it('rejects a worker whose tenant boundary is missing', () => {
    const { tenantId: _removed, ...withoutTenant } = worker;
    expect(WorkerSchema.safeParse(withoutTenant).success).toBe(false);
  });
});
