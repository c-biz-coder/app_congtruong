import type { Worker } from '../schemas/worker.schema';

export type WorkerEvent =
  | { type: 'worker.created'; worker: Worker; occurredAt: string }
  | { type: 'worker.updated'; worker: Worker; occurredAt: string }
  | {
      type: 'worker.deleted';
      workerId: string;
      tenantId: string;
      occurredAt: string;
    };

export function workerCreated(worker: Worker, occurredAt = new Date().toISOString()): WorkerEvent {
  return { type: 'worker.created', worker, occurredAt };
}

export function workerUpdated(worker: Worker, occurredAt = new Date().toISOString()): WorkerEvent {
  return { type: 'worker.updated', worker, occurredAt };
}
