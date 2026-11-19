import type { Worker } from '@partner-os/domain';
import type { ScopedRepository } from '../repository';

export const WORKER_STATUS_FILTERS = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;

export type WorkerStatusFilter = (typeof WORKER_STATUS_FILTERS)[number];

/**
 * Worker persistence contract. Implementations:
 * - Web:    Supabase/PostgreSQL adapter (online-first)
 * - Mobile: WatermelonDB local adapter (offline-first)
 */
export interface WorkerRepository extends ScopedRepository<Worker, string, string> {
  listByProject(projectId: string): Promise<Worker[]>;
  listByStatus(status: WorkerStatusFilter): Promise<Worker[]>;
}
