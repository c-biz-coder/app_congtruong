begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id) values
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333');
insert into public.tenants (id, name, code) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Workers Tenant C', 'WRK_TEST_C'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Workers Tenant D', 'WRK_TEST_D');
insert into public.memberships (user_id, tenant_id, role) values
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'SITE_MANAGER'),
  ('33333333-3333-4333-8333-333333333333', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'SITE_MANAGER');
insert into public.workers (tenant_id, code, full_name, phone_number) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'WC001', 'Worker C', '0900000001'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'WD001', 'Worker D', '0900000002');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","tenant_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","app_role":"SITE_MANAGER"}', true);

select is((select count(*) from public.workers), 1::bigint, 'workers are visible only inside own tenant');

select throws_ok(
  $$insert into public.workers (tenant_id, code, full_name, phone_number) values
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'WX001', 'Cross tenant', '0900000003')$$,
  '42501', null, 'a manager cannot insert a worker into another tenant'
);

select is(
  (select version from public.workers where code = 'WC001'),
  1,
  'new workers start at version 1 for optimistic sync'
);

select * from finish();
rollback;
