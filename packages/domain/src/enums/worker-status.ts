export const WORKER_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;

export type WorkerStatus = (typeof WORKER_STATUSES)[number];
