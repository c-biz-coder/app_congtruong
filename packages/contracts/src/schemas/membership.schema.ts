import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common.schema';

export const MembershipSchema = z.object({
  user_id: EntityIdSchema,
  tenant_id: TenantIdSchema,
  role: z.string().min(1),
});

export const MembershipsSchema = z.array(MembershipSchema);
