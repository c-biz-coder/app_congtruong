-- 007a. Allow a user to belong to several companies (tenants).
-- Drops the single-tenant constraint from 005. Data is untouched.
-- Rollback (only if no user has more than one membership):
--   alter table public.memberships add constraint memberships_one_tenant_per_user unique (user_id);

alter table public.memberships
  drop constraint if exists memberships_one_tenant_per_user;
