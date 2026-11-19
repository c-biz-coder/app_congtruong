-- 008 (step 007c). MAIN_BOD -> PROJECT_VIEWER.
-- PROJECT_VIEWER has exactly the permissions MAIN_BOD had (read + export, no writes),
-- so the backfill does not elevate anyone. Tenant and project scope are unchanged.
-- Rollback: re-insert role MAIN_BOD with its 3 permissions, set memberships.role back
-- to MAIN_BOD for rows whose role is PROJECT_VIEWER, restore the workers policy
-- with MAIN_BOD, then delete role PROJECT_VIEWER.

insert into public.roles (name, description) values
  ('PROJECT_VIEWER', 'Read-only project viewer: views and exports reports for assigned project data.')
on conflict (name) do nothing;

-- Copy MAIN_BOD's permissions (empty on a fresh DB; seeds provide them there).
insert into public.role_permissions (role_name, permission_key)
select 'PROJECT_VIEWER', permission_key
from public.role_permissions
where role_name = 'MAIN_BOD'
on conflict (role_name, permission_key) do nothing;

update public.memberships
set role = 'PROJECT_VIEWER'
where role = 'MAIN_BOD';

-- Roster read access moves from MAIN_BOD to PROJECT_VIEWER; writes stay blocked.
drop policy "workers select by roster roles" on public.workers;
create policy "workers select by roster roles"
on public.workers for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'PROJECT_VIEWER', 'SITE_MANAGER', 'SUB_CONTRACTOR')
);

-- Cascades to role_permissions for MAIN_BOD.
delete from public.roles where name = 'MAIN_BOD';
