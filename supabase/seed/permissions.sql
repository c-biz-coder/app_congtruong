-- Permission keys. Values match packages/auth/src/permissions/index.ts.
insert into public.permissions (key, description, scope) values
  ('project.read', 'View projects of the tenant', 'ORGANIZATION'),
  ('project.write', 'Create or update projects', 'ORGANIZATION'),
  ('contractor.read', 'View contractors', 'ORGANIZATION'),
  ('contractor.write', 'Manage contractors', 'ORGANIZATION'),
  ('safety.create', 'Report a safety violation', 'PROJECT'),
  ('safety.approve', 'Approve safety reports', 'PROJECT'),
  ('incident.create', 'Report an incident', 'PROJECT'),
  ('incident.approve', 'Approve/close incidents', 'PROJECT'),
  ('report.export', 'Export reports', 'GLOBAL')
on conflict (key) do nothing;