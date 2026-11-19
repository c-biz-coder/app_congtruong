import { describe, expect, it } from 'vitest';
import {
  canTransitionTo,
  requireValidTransition,
  WORKER_STATUS_TRANSITIONS,
} from './worker-status';
import { InvalidStateError } from '../errors';
import { updateWorkerStatus } from '../services/worker-service';
import type { Worker } from '../entities/Worker';

const worker: Worker = {
  id: '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1',
  tenantId: 'd44c72ee-0000-4000-8000-000000000001',
  projectId: null,
  code: 'VN123',
  fullName: 'Nguyen Van A',
  phoneNumber: '0912345678',
  status: 'ACTIVE',
};

describe('worker status transitions', () => {
  it('ACTIVE can go to INACTIVE or ON_LEAVE', () => {
    expect(canTransitionTo('ACTIVE', 'INACTIVE')).toBe(true);
    expect(canTransitionTo('ACTIVE', 'ON_LEAVE')).toBe(true);
    expect(canTransitionTo('ACTIVE', 'ACTIVE')).toBe(false);
  });

  it('rejects impossible transitions', () => {
    expect(canTransitionTo('ON_LEAVE', 'ON_LEAVE')).toBe(false);
    expect(canTransitionTo('INACTIVE', 'ON_LEAVE')).toBe(false);
  });

  it('requireValidTransition throws a DomainError for invalid moves', () => {
    expect(() => requireValidTransition('INACTIVE', 'ON_LEAVE')).toThrow(InvalidStateError);
  });

  it('every status is a key in the transition map', () => {
    expect(Object.keys(WORKER_STATUS_TRANSITIONS)).toEqual(['ACTIVE', 'INACTIVE', 'ON_LEAVE']);
  });

  it('updateWorkerStatus returns an updated record', () => {
    const updated = updateWorkerStatus(worker, 'ON_LEAVE');
    expect(updated.status).toBe('ON_LEAVE');
    expect(updated.fullName).toBe(worker.fullName);
  });
});
