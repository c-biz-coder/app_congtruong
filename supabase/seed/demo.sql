-- Demo tenant + project + worker set for local development only.
-- Never used as production data.
insert into public.tenants (id, name, code) values
  ('d44c72ee-0000-4000-8000-000000000001', 'Demo Cong Ty Xay Dung', 'DEMO1')
on conflict (id) do nothing;

insert into public.organizations (id, tenant_id, name, code) values
  ('c78c72ee-0000-4000-8000-000000000001', 'd44c72ee-0000-4000-8000-000000000001', 'TCT Ha Noi', 'ORG1')
on conflict (id) do nothing;

insert into public.projects (id, tenant_id, organization_id, site_name, address) values
  ('3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1', 'd44c72ee-0000-4000-8000-000000000001', 'c78c72ee-0000-4000-8000-000000000001', 'CC Vinhomes', 'Ha Noi')
on conflict (id) do nothing;

insert into public.workers (id, tenant_id, project_id, code, full_name, phone_number, status) values
  ('5a9f2b20-0000-4000-8000-000000000001', 'd44c72ee-0000-4000-8000-000000000001', '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1', 'VN001', 'Nguyen Van An', '0912345678', 'ACTIVE'),
  ('5a9f2b20-0000-4000-8000-000000000002', 'd44c72ee-0000-4000-8000-000000000001', '3f2b6f38-85dd-4d6a-b6ba-5b2d29f0a6c1', 'VN002', 'Tran Thi Bich', '0987654321', 'ACTIVE')
on conflict (id) do nothing;