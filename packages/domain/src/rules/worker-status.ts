import type { WorkerStatus } from '../enums/worker-status';
import { InvalidStateError } from '../errors';

/**
 * Allowed status transitions for a worker. A worker cannot jump between
 * arbitrary states (e.g. straight from ON_LEAVE to nothing); the graph keeps
 * HR audits predictable.
 */
export const WORKER_STATUS_TRANSITIONS: Record<WorkerStatus, readonly WorkerStatus[]> = {
  ACTIVE: ['INACTIVE', 'ON_LEAVE'],
  INACTIVE: ['ACTIVE'],
  ON_LEAVE: ['ACTIVE', 'INACTIVE'],
};

export function canTransitionTo(from: WorkerStatus, to: WorkerStatus): boolean {
  return WORKER_STATUS_TRANSITIONS[from].includes(to);
}

export function requireValidTransition(from: WorkerStatus, to: WorkerStatus): void {
  if (!canTransitionTo(from, to)) {
    throw new InvalidStateError(`Cannot transition worker from ${from} to ${to}`, {
      from,
      to,
    });
  }
}
