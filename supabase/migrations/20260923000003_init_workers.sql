-- 003. Workers domain table with RLS + indexes (contract section 10, 11, 17).
-- The old bootstrap migration referenced public.workers without creating it;
-- this migration creates it properly.

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  code text not null,
  full_name text not null,
  phone_number text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code)
);

create index idx_workers_tenant_id on public.workers (tenant_id);
create index idx_workers_project_id on public.workers (project_id);
create index idx_workers_created_at on public.workers (created_at);

create trigger workers_set_updated_at before update on public.workers
for each row execute function public.set_updated_at();

alter table public.workers enable row level security;

-- SELECT: only rows belonging to the caller's tenant.
create policy "workers select within own tenant"
on public.workers for select to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- INSERT: role-gated + tenant-bound.
create policy "workers insert by tenant managers"
on public.workers for insert to authenticated
with check (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  and (auth.jwt() ->> 'role') in ('SYS_ADMIN', 'SITE_MANAGER', 'SUB_CONTRACTOR')
);

-- UPDATE: cannot move a row across tenants.
create policy "workers update within own tenant"
on public.workers for update to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- DELETE: soft-delete is preferred; hard delete is manager-only.
create policy "workers delete by tenant managers"
on public.workers for delete to authenticated
using (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  and (auth.jwt() ->> 'role') in ('SYS_ADMIN', 'SITE_MANAGER')
);