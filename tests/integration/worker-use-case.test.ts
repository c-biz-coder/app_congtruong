import { describe, expect, it } from 'vitest';
import type { Worker, WorkerApi } from '@partner-os/contracts';
import { listWorkers } from '../../apps/web/src/features/workers/services/worker-application';

const workers: Worker[] = [
  {
    id: '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1',
    tenantId: 'd44c72ee-0000-4000-8000-000000000001',
    projectId: null,
    code: 'VN001',
    fullName: 'Nguyen Van An',
    phoneNumber: '0912345678',
    status: 'ACTIVE',
  },
];

const api: WorkerApi = {
  async list() {
    return workers;
  },
  async findById() {
    return workers[0];
  },
  async create() {
    throw new Error('not used');
  },
  async update() {
    throw new Error('not used');
  },
  async remove() {
    throw new Error('not used');
  },
};

describe('workers use-case: listWorkers', () => {
  it('forwards a validated query to the adapter and returns rows', async () => {
    const result = await listWorkers(api, {
      tenantId: 'd44c72ee-0000-4000-8000-000000000001',
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.fullName).toBe('Nguyen Van An');
  });

  it('rejects a malformed query at the boundary', async () => {
    await expect(listWorkers(api, { tenantId: 'not-a-uuid' })).rejects.toThrow();
  });
});
