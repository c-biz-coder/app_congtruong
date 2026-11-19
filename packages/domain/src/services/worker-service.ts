import type { Worker } from '../entities/Worker';
import type { WorkerStatus } from '../enums/worker-status';
import { DomainError, EntityNotFoundError, InvalidStateError } from '../errors';
import { requireValidWorkerCode } from '../rules/worker-code';
import { requireValidTransition } from '../rules/worker-status';

/**
 * Domain service: guards a worker aggregate against breaking core business rules.
 * Independent of any framework, database or UI.
 */
export function validateWorkerRecord(worker: Worker): Worker {
  requireValidWorkerCode(worker.code);
  if (worker.fullName.trim().length < 2) {
    throw new InvalidStateError('fullName must have at least 2 characters');
  }
  return worker;
}

export function requireWorkerExists(worker: Worker | null, workerId: string): Worker {
  if (!worker) {
    throw new EntityNotFoundError('Worker', workerId);
  }
  return worker;
}

export function assertSameTenant(workerTenantId: string, tenantId: string): void {
  if (workerTenantId !== tenantId) {
    throw new DomainError('TENANT_MISMATCH', 'Worker does not belong to the current tenant', {
      expectedTenantId: tenantId,
    });
  }
}

export function getWorkerDisplayName(worker: Worker): string {
  return worker.fullName.trim();
}

export function canBeAssignedToProject(worker: Worker): boolean {
  return worker.status === 'ACTIVE';
}

/** Apply a valid status transition to a worker record. Pure domain operation. */
export function updateWorkerStatus(worker: Worker, nextStatus: WorkerStatus): Worker {
  requireValidTransition(worker.status, nextStatus);
  return { ...worker, status: nextStatus };
}
