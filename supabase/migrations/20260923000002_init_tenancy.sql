-- 002. Tenancy foundation: tenants, organizations, projects, memberships
-- Multi-tenant boundary starts at the database level (contract section 9 & 10).

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  code text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  site_name text not null,
  address text not null default '',
  status text not null default 'ACTIVE' check (status in ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Membership: User -> Organization (contract authorization chain).
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null references public.roles(name),
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);

create index idx_organizations_tenant_id on public.organizations (tenant_id);
create index idx_projects_tenant_id on public.projects (tenant_id);
create index idx_projects_organization_id on public.projects (organization_id);
create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_tenant_id on public.memberships (tenant_id);

create trigger tenants_set_updated_at before update on public.tenants
for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.memberships enable row level security;

-- A tenant is visible to its own members or SYS_ADMIN.
create policy "tenants visible to own members or SYS_ADMIN"
on public.tenants for select to authenticated
using (
  (auth.jwt() ->> 'role') = 'SYS_ADMIN'
  or id = (auth.jwt() ->> 'tenant_id')::uuid
);

create policy "organizations visible within own tenant"
on public.organizations for select to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "projects visible within own tenant"
on public.projects for select to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "memberships readable by the user themselves or within own tenant"
on public.memberships for select to authenticated
using (
  user_id = auth.uid()
  or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Write path requires an admin/manager role assigned to the tenant.
create policy "organizations writable by tenant managers"
on public.organizations for insert to authenticated
with check (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  and (auth.jwt() ->> 'role') in ('SYS_ADMIN', 'MAIN_BOD', 'SITE_MANAGER')
);

create policy "projects writable by tenant managers"
on public.projects for insert to authenticated
with check (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  and (auth.jwt() ->> 'role') in ('SYS_ADMIN', 'SITE_MANAGER')
);

create policy "projects updatable within own tenant"
on public.projects for update to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);