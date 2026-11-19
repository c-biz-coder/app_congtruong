-- 001. RBAC foundation: roles, permissions, role_permissions
-- Contract: seeds live in supabase/seed/*.sql, tables live here.

-- Helper: keep updated_at in sync on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.roles (
  name text primary key,
  description text not null default ''
);

create table public.permissions (
  key text primary key,
  description text not null default '',
  scope text not null check (scope in ('GLOBAL', 'ORGANIZATION', 'PROJECT'))
);

create table public.role_permissions (
  role_name text not null references public.roles(name) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_name, permission_key)
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- Read-only reference data for any authenticated user.
create policy "roles are readable by authenticated users"
on public.roles for select to authenticated using (true);

create policy "permissions are readable by authenticated users"
on public.permissions for select to authenticated using (true);

create policy "role_permissions are readable by authenticated users"
on public.role_permissions for select to authenticated using (true);

-- Only SYS_ADMIN may mutate reference data.
create policy "roles are writable by SYS_ADMIN"
on public.roles for all to authenticated
using ((auth.jwt() ->> 'role') = 'SYS_ADMIN')
with check ((auth.jwt() ->> 'role') = 'SYS_ADMIN');

create policy "permissions are writable by SYS_ADMIN"
on public.permissions for all to authenticated
using ((auth.jwt() ->> 'role') = 'SYS_ADMIN')
with check ((auth.jwt() ->> 'role') = 'SYS_ADMIN');

create policy "role_permissions are writable by SYS_ADMIN"
on public.role_permissions for all to authenticated
using ((auth.jwt() ->> 'role') = 'SYS_ADMIN')
with check ((auth.jwt() ->> 'role') = 'SYS_ADMIN');