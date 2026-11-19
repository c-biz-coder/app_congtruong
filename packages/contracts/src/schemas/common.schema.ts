import { z } from 'zod';

export const EntityIdSchema = z.uuid('id must be a valid UUID');

export const TenantIdSchema = z.uuid('tenant id must be a valid UUID');

export const ProjectIdSchema = z.uuid('project id must be a valid UUID');

export const NullableProjectIdSchema = ProjectIdSchema.nullable();

export const TimestampsSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  deletedAt: z.iso.datetime({ offset: true }).nullish(),
});

export type Timestamps = z.infer<typeof TimestampsSchema>;
