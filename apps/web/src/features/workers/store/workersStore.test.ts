import { describe, expect, it } from 'vitest';
import type { Worker, WorkerApi } from '@partner-os/contracts';
import { createWorkersStore } from './workersStore';
import { DomainError } from '@partner-os/domain';

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
  {
    id: '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c2',
    tenantId: 'd44c72ee-0000-4000-8000-000000000001',
    projectId: null,
    code: 'VN002',
    fullName: 'Tran Thi Bich',
    phoneNumber: '0987654321',
    status: 'ON_LEAVE',
  },
];

function fakeApi(): WorkerApi {
  return {
    async list() {
      return workers;
    },
    async findById(id) {
      return workers.find((worker) => worker.id === id) ?? null;
    },
    async create(_input) {
      throw new DomainError('NOT_IMPLEMENTED', 'fake create is not implemented');
    },
    async update(_id, _patch) {
      throw new DomainError('NOT_IMPLEMENTED', 'fake update is not implemented');
    },
    async remove(_id) {
      throw new DomainError('NOT_IMPLEMENTED', 'fake remove is not implemented');
    },
  };
}

describe('workersStore', () => {
  it('loads workers through the application service and exposes them as loaded', async () => {
    const store = createWorkersStore();
    await store.load(fakeApi(), { tenantId: 'd44c72ee-0000-4000-8000-000000000001' });

    expect(store.status).toBe('loaded');
    expect(store.workers).toHaveLength(2);
  });

  it('surfaces adapter errors instead of silently passing', async () => {
    const brokenApi: WorkerApi = {
      async list() {
        throw new Error('boom');
      },
      async findById() {
        throw new Error('boom');
      },
      async create() {
        throw new Error('boom');
      },
      async update() {
        throw new Error('boom');
      },
      async remove() {
        throw new Error('boom');
      },
    };
    const store = createWorkersStore();
    await store.load(brokenApi, { tenantId: 'd44c72ee-0000-4000-8000-000000000001' });

    expect(store.status).toBe('error');
    expect(store.error).toBe('boom');
  });
});
