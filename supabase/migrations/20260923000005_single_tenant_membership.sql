-- The MVP supports exactly one tenant per user. Existing duplicate memberships
-- must be reconciled by an administrator before applying this migration.
alter table public.memberships
  add constraint memberships_one_tenant_per_user unique (user_id);
