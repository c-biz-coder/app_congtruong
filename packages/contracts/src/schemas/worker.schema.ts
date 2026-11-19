import { z } from 'zod';
import { EntityIdSchema, NullableProjectIdSchema, TenantIdSchema } from './common.schema';

export const WorkerStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']);

export const WorkerSchema = z
  .object({
    id: EntityIdSchema,
    tenantId: TenantIdSchema,
    projectId: NullableProjectIdSchema,
    code: z
      .string()
      .min(3, 'worker code must have at least 3 characters')
      .max(20, 'worker code must have at most 20 characters')
      .regex(/^[A-Z0-9]*$/, 'worker code must be uppercase alphanumeric'),
    fullName: z.string().min(2, 'full name must have at least 2 characters'),
    phoneNumber: z
      .string()
      .regex(
        /^(?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}$/,
        'phone number must be a valid Vietnamese mobile number',
      ),
    status: WorkerStatusSchema,
  })
  .strict();

export type Worker = z.infer<typeof WorkerSchema>;
export type WorkerStatus = z.infer<typeof WorkerStatusSchema>;

export function parseWorker(input: unknown): Worker {
  return WorkerSchema.parse(input);
}

export type ParseWorkerResult = ReturnType<typeof WorkerSchema.safeParse>;

export function safeParseWorker(input: unknown): ParseWorkerResult {
  return WorkerSchema.safeParse(input);
}
