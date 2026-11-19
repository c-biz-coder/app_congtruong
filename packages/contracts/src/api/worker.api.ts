import type { Worker } from '../schemas/worker.schema';
import type { CreateWorkerInput, UpdateWorkerInput, WorkerListQuery } from '../dto/worker.dto';

/**
 * The boundary contract the Web and Mobile clients agree on when talking
 * to the application service / repository layer.
 */
export interface WorkerApi {
  list(query: WorkerListQuery): Promise<Worker[]>;
  findById(id: string): Promise<Worker | null>;
  create(input: CreateWorkerInput): Promise<Worker>;
  update(id: string, patch: UpdateWorkerInput): Promise<Worker>;
  remove(id: string): Promise<{ id: string; deletedAt: string }>;
}
