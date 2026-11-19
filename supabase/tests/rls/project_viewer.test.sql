begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id) values
  ('55555555-5555-4555-8555-555555555555');
insert into public.tenants (id, name, code) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Viewer Tenant E', 'VWR_TEST_E'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Viewer Tenant F', 'VWR_TEST_F');
insert into public.memberships (user_id, tenant_id, role) values
  ('55555555-5555-4555-8555-555555555555', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'PROJECT_VIEWER');
insert into public.workers (tenant_id, code, full_name, phone_number) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'VE001', 'Worker E', '0900000011'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'VF001', 'Worker F', '0900000012');

select is((select count(*) from public.roles where name = 'MAIN_BOD'), 0::bigint, 'MAIN_BOD role is removed by the backfill');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","tenant_id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","app_role":"PROJECT_VIEWER"}', true);

select is((select count(*) from public.workers), 1::bigint, 'viewer reads the roster only inside own tenant');

select throws_ok(
  $$insert into public.workers (tenant_id, code, full_name, phone_number) values
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'VE002', 'New', '0900000013')$$,
  '42501', null, 'viewer cannot insert workers'
);

select throws_ok(
  $$insert into public.projects (tenant_id, site_name) values
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Viewer project')$$,
  '42501', null, 'viewer cannot create projects'
);

select lives_ok(
  $$update public.workers set full_name = 'Hacked' where code = 'VE001'$$,
  'viewer update on workers is accepted by RLS but matches no row'
);

select lives_ok(
  $$delete from public.workers where code = 'VE001'$$,
  'viewer delete on workers is accepted by RLS but matches no row'
);

select is(
  (select full_name from public.workers where code = 'VE001'),
  'Worker E',
  'viewer update and delete on workers had no effect'
);

select * from finish();
rollback;
