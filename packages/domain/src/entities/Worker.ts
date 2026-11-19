import type { WorkerStatus } from '../enums/worker-status';

/**
 * Domain entity: a worker on a construction site.
 * Framework-free. Multi-tenant via `tenantId`, site-scoped via `projectId`.
 */
export interface Worker {
  id: string;
  tenantId: string;
  projectId: string | null;
  code: string;
  fullName: string;
  phoneNumber: string;
  status: WorkerStatus;
}
