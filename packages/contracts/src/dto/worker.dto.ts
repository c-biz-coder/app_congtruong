import { z } from 'zod';
import { WorkerSchema } from '../schemas/worker.schema';

export const CreateWorkerInput = WorkerSchema.omit({ id: true, status: true }).extend({
  status: WorkerSchema.shape.status.optional(),
});

export type CreateWorkerInput = z.infer<typeof CreateWorkerInput>;

export const UpdateWorkerInput = WorkerSchema.omit({ id: true, tenantId: true }).partial();

export type UpdateWorkerInput = z.infer<typeof UpdateWorkerInput>;

export const WorkerListQuery = z.object({
  tenantId: z.uuid('tenant id must be a valid UUID'),
  projectId: z.uuid().optional(),
  status: WorkerSchema.shape.status.optional(),
});

export type WorkerListQuery = z.infer<typeof WorkerListQuery>;
