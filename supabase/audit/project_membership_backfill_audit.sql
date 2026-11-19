-- Read-only audit for migration 20260923000009 (project_companies / project_memberships backfill).
-- Run BEFORE and AFTER the migration against the same database and compare the numbers.
-- Nothing here writes data.

-- 1. Row counts (memberships must be identical before and after).
select 'counts' as section,
  (select count(*) from public.memberships) as memberships,
  (select count(*) from public.projects) as projects,
  (select count(*) from public.project_companies) as project_companies,
  (select count(*) from public.project_memberships) as project_memberships;

-- 2. Expected backfill result, computed from source tables.
select 'expected' as section,
  (select count(*) from public.projects) as expected_main_contractor,
  (select count(*) from public.memberships m
     join public.projects p on p.tenant_id = m.tenant_id) as expected_project_memberships;

-- 3. Success / missing / duplicate / orphan / insufficient-data checks. All should be 0 except
--    the two informational rows (insufficient_*) which need manual assignment.
select 'main_contractor_missing' as check_name, count(*) as issues
from public.projects p
where not exists (
  select 1 from public.project_companies pc
  where pc.project_id = p.id and pc.tenant_id = p.tenant_id and pc.participation_type = 'MAIN_CONTRACTOR'
)
union all
select 'project_membership_missing', count(*)
from public.memberships m
join public.projects p on p.tenant_id = m.tenant_id
where not exists (
  select 1 from public.project_memberships pm
  where pm.user_id = m.user_id and pm.project_id = p.id and pm.tenant_id = m.tenant_id and pm.role = m.role
)
union all
select 'project_membership_duplicates', count(*) from (
  select user_id, project_id, tenant_id, role from public.project_memberships
  group by user_id, project_id, tenant_id, role having count(*) > 1
) d
union all
select 'project_membership_without_project_company', count(*)
from public.project_memberships pm
where not exists (
  select 1 from public.project_companies pc
  where pc.project_id = pm.project_id and pc.tenant_id = pm.tenant_id
)
union all
select 'project_membership_role_unknown', count(*)
from public.project_memberships pm
where not exists (select 1 from public.roles r where r.name = pm.role)
union all
select 'insufficient_tenant_without_projects', count(distinct m.tenant_id)
from public.memberships m
where not exists (select 1 from public.projects p where p.tenant_id = m.tenant_id)
union all
select 'insufficient_membership_role_unknown', count(*)
from public.memberships m
where not exists (select 1 from public.roles r where r.name = m.role)
union all
select 'info_backfilled_soft_deleted_projects', count(*)
from public.projects p
where p.deleted_at is not null;

-- 4. Per-tenant coverage: users, owned projects, participations.
select m.tenant_id,
  count(distinct m.user_id) as users,
  (select count(*) from public.projects p where p.tenant_id = m.tenant_id) as owned_projects,
  (select count(*) from public.project_companies pc where pc.tenant_id = m.tenant_id) as participations
from public.memberships m
group by m.tenant_id
order by m.tenant_id;
