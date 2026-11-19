-- Rollback for 20260923000009_project_memberships.sql.
-- Preserves data: rows written after the migration are copied to archive tables first.
-- Archive tables are created with plain CREATE (no IF NOT EXISTS), so a second run fails
-- instead of overwriting an earlier archive.
-- Tenant-level memberships (memberships table) are untouched.

begin;

create table public.archive_project_companies_20260923000009 as
  select * from public.project_companies;
create table public.archive_project_memberships_20260923000009 as
  select * from public.project_memberships;

drop trigger if exists projects_add_main_contractor on public.projects;
drop function if exists public.add_main_contractor_to_project();

drop table public.project_memberships;
drop table public.project_companies;

drop function if exists public.is_main_contractor_manager(uuid);
drop function if exists public.is_project_member(uuid);
drop function if exists public.my_tenant_ids();

commit;
