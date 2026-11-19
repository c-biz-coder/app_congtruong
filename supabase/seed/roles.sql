-- Fixed, static roles used across the whole system.
-- These values match packages/auth/src/roles/index.ts.
insert into public.roles (name, description) values
  ('SYS_ADMIN', 'System administrator: full control.'),
  ('PROJECT_VIEWER', 'Read-only project viewer: views and exports reports for assigned project data.'),
  ('SITE_MANAGER', 'Site manager: manages a project end to end.'),
  ('SUB_CONTRACTOR', 'Sub-contractor lead: manages only their own team.'),
  ('WORKER', 'Worker: personal schedule, pay slip and safety reports.')
on conflict (name) do nothing;