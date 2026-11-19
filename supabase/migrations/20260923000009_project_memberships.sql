-- 007b. Project/company membership model.
-- project_companies: which companies (tenants) take part in a project, and how.
-- project_memberships: which user holds which role, in which project and company.
-- memberships (tenant-level) and memberships.role stay in place (deprecated, not used for new authorization).
--
-- Backfill keeps existing access: every project gets a MAIN_CONTRACTOR row for its
-- owning tenant, and every existing membership gets a PROJECT-scoped row for each
-- project of that tenant with the same role. No privilege is raised.
--
-- Rollback: run supabase/rollbacks/20260923000009_project_memberships.down.sql
-- (archives rows created after this migration before dropping objects).

create table public.project_companies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  participation_type text not null
    check (participation_type in ('MAIN_CONTRACTOR', 'SUBCONTRACTOR', 'OTHER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'ENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, tenant_id)
);

create table public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null references public.roles(name),
  scope text not null check (scope in ('COMPANY', 'PROJECT_COMPANY', 'PROJECT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id, tenant_id, role),
  -- The company must take part in the project.
  constraint project_memberships_project_company_fk
    foreign key (project_id, tenant_id)
    references public.project_companies (project_id, tenant_id)
    on delete cascade
);

create index idx_project_companies_tenant_id on public.project_companies (tenant_id);
create index idx_project_memberships_user_id on public.project_memberships (user_id);
create index idx_project_memberships_project_id on public.project_memberships (project_id);
create index idx_project_memberships_tenant_id on public.project_memberships (tenant_id);

create trigger project_companies_set_updated_at before update on public.project_companies
for each row execute function public.set_updated_at();
create trigger project_memberships_set_updated_at before update on public.project_memberships
for each row execute function public.set_updated_at();

-- Every new project gets its owning tenant as MAIN_CONTRACTOR.
create or replace function public.add_main_contractor_to_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_companies (project_id, tenant_id, participation_type)
  values (new.id, new.tenant_id, 'MAIN_CONTRACTOR')
  on conflict (project_id, tenant_id) do nothing;
  return new;
end;
$$;

create trigger projects_add_main_contractor after insert on public.projects
for each row execute function public.add_main_contractor_to_project();

-- Backfill (runs once, preserves current access).
insert into public.project_companies (project_id, tenant_id, participation_type)
select p.id, p.tenant_id, 'MAIN_CONTRACTOR'
from public.projects p
on conflict (project_id, tenant_id) do nothing;

insert into public.project_memberships (user_id, project_id, tenant_id, role, scope)
select m.user_id, p.id, m.tenant_id, m.role, 'PROJECT'
from public.memberships m
join public.projects p on p.tenant_id = m.tenant_id
on conflict (user_id, project_id, tenant_id, role) do nothing;

-- Helpers (security definer avoids RLS recursion, same pattern as migration 004).
create or replace function public.my_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id from public.memberships m where m.user_id = auth.uid()
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_memberships pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  )
$$;

-- Who may read the membership list of a project (other than their own row):
--  * a SITE_MANAGER of the MAIN_CONTRACTOR company in that project sees all rows.
-- Every other user (including Worker and Subcontractor staff) sees only their own row.
-- Subcontractor management and worker-level visibility are decided in 007d.
create or replace function public.is_main_contractor_manager(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_memberships pm
    join public.project_companies pc
      on pc.project_id = pm.project_id and pc.tenant_id = pm.tenant_id
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and pm.role = 'SITE_MANAGER'
      and pc.participation_type = 'MAIN_CONTRACTOR'
  )
$$;

revoke execute on function public.my_tenant_ids() from public, anon;
revoke execute on function public.is_project_member(uuid) from public, anon;
revoke execute on function public.is_main_contractor_manager(uuid) from public, anon;
grant execute on function public.my_tenant_ids() to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_main_contractor_manager(uuid) to authenticated;

-- RLS: read-only for end users. Writes go through the backend (service role) until
-- authorization rules for management actions are added in 007d.
alter table public.project_companies enable row level security;
alter table public.project_memberships enable row level security;

create policy "project companies visible to project members"
on public.project_companies for select to authenticated
using (public.is_project_member(project_id));

create policy "project memberships visible to self or main contractor managers"
on public.project_memberships for select to authenticated
using (
  user_id = auth.uid()
  or public.is_main_contractor_manager(project_id)
);
