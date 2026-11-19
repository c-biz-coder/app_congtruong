-- M-E. Append-only audit log.
-- Rows are written only through write_audit(); update, delete and truncate are rejected
-- for every role, including the table owner (trigger).
-- Payload keys are limited to an approved allowlist (no names, phone numbers or staff codes).
-- Backfill: none. Audit starts at deployment.
--
-- Rollback: supabase/rollbacks/20260923000010_audit_log.down.sql (only when the table is empty).

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  action text not null,
  target_type text,
  target_id text,
  tenant_id uuid,
  project_id uuid,
  project_company_id uuid,
  payload jsonb not null default '{}'::jsonb,
  request_id text,
  constraint audit_log_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create index idx_audit_log_tenant_occurred on public.audit_log (tenant_id, occurred_at);
create index idx_audit_log_project_occurred on public.audit_log (project_id, occurred_at);

create or replace function public.audit_log_block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only' using errcode = 'P0001';
end;
$$;

create trigger audit_log_no_update_delete before update or delete on public.audit_log
for each row execute function public.audit_log_block_mutation();

create trigger audit_log_no_truncate before truncate on public.audit_log
for each statement execute function public.audit_log_block_mutation();

revoke update, delete, truncate on public.audit_log from authenticated, anon;

-- Payload allowlist. Any other key is rejected.
create or replace function public.audit_payload_allowed(p_payload jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not exists (
    select 1
    from jsonb_object_keys(p_payload) as k(key)
    where k.key not in (
      'project_id', 'project_company_id', 'target_user_id', 'reason', 'role_before', 'role_after'
    )
  )
$$;

-- Actor must be the caller, and must belong to the tenant and/or project being audited.
create or replace function public.write_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_tenant_id uuid,
  p_project_id uuid,
  p_project_company_id uuid,
  p_payload jsonb,
  p_request_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'write_audit requires an authenticated actor' using errcode = '42501';
  end if;
  if p_tenant_id is null and p_project_id is null then
    raise exception 'write_audit requires a tenant or project scope' using errcode = '22023';
  end if;
  if p_tenant_id is not null and p_tenant_id not in (select public.my_tenant_ids()) then
    raise exception 'actor is not a member of the tenant' using errcode = '42501';
  end if;
  if p_project_id is not null and not public.is_project_member(p_project_id) then
    raise exception 'actor is not a member of the project' using errcode = '42501';
  end if;
  if p_payload is null or not public.audit_payload_allowed(p_payload) then
    raise exception 'audit payload contains keys outside the allowlist' using errcode = '22023';
  end if;

  insert into public.audit_log (
    actor_user_id, action, target_type, target_id, tenant_id, project_id,
    project_company_id, payload, request_id
  ) values (
    v_actor, p_action, p_target_type, p_target_id, p_tenant_id, p_project_id,
    p_project_company_id, p_payload, p_request_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Read: members of the tenant who hold a tenant administration role.
-- Redefined in M-A when COMPANY_ADMIN is introduced.
create or replace function public.can_read_audit(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = p_tenant_id
      and m.role = 'SYS_ADMIN'
  )
$$;

revoke execute on function public.audit_payload_allowed(jsonb) from public, anon;
revoke execute on function public.write_audit(text, text, text, uuid, uuid, uuid, jsonb, text) from public, anon;
revoke execute on function public.can_read_audit(uuid) from public, anon;
grant execute on function public.audit_payload_allowed(jsonb) to authenticated;
grant execute on function public.write_audit(text, text, text, uuid, uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.can_read_audit(uuid) to authenticated;

alter table public.audit_log enable row level security;

create policy "audit log readable by tenant administrators"
on public.audit_log for select to authenticated
using (tenant_id is not null and public.can_read_audit(tenant_id));
