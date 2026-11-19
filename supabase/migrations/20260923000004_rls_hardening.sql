-- 004. RLS hardening: explicit app claims, role-gated writes, same-tenant checks.
-- Supabase reserves the top-level JWT `role` claim (always "authenticated"),
-- so the application role travels in `app_role`. Both claims are set by
-- public.custom_access_token_hook (configured in supabase/config.toml).

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.jwt() ->> 'app_role'
$$;

-- Access token hook: copies the user's first tenant membership into the JWT.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  membership record;
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select m.tenant_id, m.role
    into membership
    from public.memberships m
   where m.user_id = (event ->> 'user_id')::uuid
   order by m.created_at, m.id
   limit 1;

  if found then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(membership.tenant_id::text));
    claims := jsonb_set(claims, '{app_role}', to_jsonb(membership.role));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on table public.memberships to supabase_auth_admin;

create policy "memberships readable by the auth hook"
on public.memberships for select to supabase_auth_admin
using (true);

-- Same-tenant guards: a row may only reference a project/organization of its own tenant.
create or replace function public.assert_workers_same_tenant_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.tenant_id = new.tenant_id
  ) then
    raise exception 'project % does not belong to tenant %', new.project_id, new.tenant_id
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create or replace function public.assert_projects_same_tenant_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id is not null and not exists (
    select 1 from public.organizations o
    where o.id = new.organization_id and o.tenant_id = new.tenant_id
  ) then
    raise exception 'organization % does not belong to tenant %', new.organization_id, new.tenant_id
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger workers_same_tenant_project
before insert or update of tenant_id, project_id on public.workers
for each row execute function public.assert_workers_same_tenant_project();

create trigger projects_same_tenant_organization
before insert or update of tenant_id, organization_id on public.projects
for each row execute function public.assert_projects_same_tenant_organization();

-- RBAC reference data: only SYS_ADMIN mutates (claim renamed to app_role).
drop policy "roles are writable by SYS_ADMIN" on public.roles;
drop policy "permissions are writable by SYS_ADMIN" on public.permissions;
drop policy "role_permissions are writable by SYS_ADMIN" on public.role_permissions;

create policy "roles are writable by SYS_ADMIN"
on public.roles for all to authenticated
using (public.current_app_role() = 'SYS_ADMIN')
with check (public.current_app_role() = 'SYS_ADMIN');

create policy "permissions are writable by SYS_ADMIN"
on public.permissions for all to authenticated
using (public.current_app_role() = 'SYS_ADMIN')
with check (public.current_app_role() = 'SYS_ADMIN');

create policy "role_permissions are writable by SYS_ADMIN"
on public.role_permissions for all to authenticated
using (public.current_app_role() = 'SYS_ADMIN')
with check (public.current_app_role() = 'SYS_ADMIN');

-- Tenancy policies.
drop policy "tenants visible to own members or SYS_ADMIN" on public.tenants;
drop policy "organizations visible within own tenant" on public.organizations;
drop policy "projects visible within own tenant" on public.projects;
drop policy "memberships readable by the user themselves or within own tenant" on public.memberships;
drop policy "organizations writable by tenant managers" on public.organizations;
drop policy "projects writable by tenant managers" on public.projects;
drop policy "projects updatable within own tenant" on public.projects;

create policy "tenants visible to own members or SYS_ADMIN"
on public.tenants for select to authenticated
using (
  public.current_app_role() = 'SYS_ADMIN'
  or id = public.current_tenant_id()
);

create policy "organizations visible within own tenant"
on public.organizations for select to authenticated
using (tenant_id = public.current_tenant_id());

create policy "projects visible within own tenant"
on public.projects for select to authenticated
using (tenant_id = public.current_tenant_id());

-- Own membership row, or the tenant's managers see the full member list.
create policy "memberships readable by the user themselves or tenant managers"
on public.memberships for select to authenticated
using (
  user_id = auth.uid()
  or (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
  )
);

create policy "organizations writable by tenant managers"
on public.organizations for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
);

create policy "projects writable by tenant managers"
on public.projects for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
);

-- Soft delete (deleted_at) goes through UPDATE, so it is gated here too.
create policy "projects updatable by tenant managers"
on public.projects for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
);

-- Workers policies.
drop policy "workers select within own tenant" on public.workers;
drop policy "workers insert by tenant managers" on public.workers;
drop policy "workers update within own tenant" on public.workers;
drop policy "workers delete by tenant managers" on public.workers;

-- WORKER has no read access to the roster: no worker->user link exists yet [CẦN XÁC NHẬN].
create policy "workers select by roster roles"
on public.workers for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'MAIN_BOD', 'SITE_MANAGER', 'SUB_CONTRACTOR')
);

create policy "workers insert by roster managers"
on public.workers for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER', 'SUB_CONTRACTOR')
);

create policy "workers update by roster managers"
on public.workers for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER', 'SUB_CONTRACTOR')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER', 'SUB_CONTRACTOR')
);

create policy "workers hard delete by site managers"
on public.workers for delete to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('SYS_ADMIN', 'SITE_MANAGER')
);
