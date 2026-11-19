begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id) values
  ('61111111-1111-4111-8111-111111111111'),
  ('62222222-2222-4222-8222-222222222222'),
  ('63333333-3333-4333-8333-333333333333'),
  ('64444444-4444-4444-8444-444444444444');

insert into public.tenants (id, name, code) values
  ('71111111-1111-4111-8111-111111111111', 'PM Main Contractor', 'PM_TEST_MC'),
  ('72222222-2222-4222-8222-222222222222', 'PM Subcontractor', 'PM_TEST_SUB'),
  ('73333333-3333-4333-8333-333333333333', 'PM Other Contractor', 'PM_TEST_OTH');

insert into public.memberships (user_id, tenant_id, role) values
  ('61111111-1111-4111-8111-111111111111', '71111111-1111-4111-8111-111111111111', 'SITE_MANAGER'),
  ('62222222-2222-4222-8222-222222222222', '72222222-2222-4222-8222-222222222222', 'SUB_CONTRACTOR'),
  ('63333333-3333-4333-8333-333333333333', '72222222-2222-4222-8222-222222222222', 'WORKER'),
  ('64444444-4444-4444-8444-444444444444', '73333333-3333-4333-8333-333333333333', 'WORKER');

-- The projects trigger adds the MAIN_CONTRACTOR company for each project.
insert into public.projects (id, tenant_id, site_name) values
  ('81111111-1111-4111-8111-111111111111', '71111111-1111-4111-8111-111111111111', 'PM Project One'),
  ('82222222-2222-4222-8222-222222222222', '71111111-1111-4111-8111-111111111111', 'PM Project Two');

insert into public.project_companies (project_id, tenant_id, participation_type) values
  ('81111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222', 'SUBCONTRACTOR'),
  ('81111111-1111-4111-8111-111111111111', '73333333-3333-4333-8333-333333333333', 'OTHER'),
  ('82222222-2222-4222-8222-222222222222', '72222222-2222-4222-8222-222222222222', 'SUBCONTRACTOR');

-- The worker from the subcontractor has a different role in each project.
insert into public.project_memberships (user_id, project_id, tenant_id, role, scope) values
  ('61111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111', '71111111-1111-4111-8111-111111111111', 'SITE_MANAGER', 'PROJECT'),
  ('61111111-1111-4111-8111-111111111111', '82222222-2222-4222-8222-222222222222', '71111111-1111-4111-8111-111111111111', 'SITE_MANAGER', 'PROJECT'),
  ('62222222-2222-4222-8222-222222222222', '81111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222', 'SUB_CONTRACTOR', 'PROJECT_COMPANY'),
  ('63333333-3333-4333-8333-333333333333', '81111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222', 'WORKER', 'PROJECT_COMPANY'),
  ('64444444-4444-4444-8444-444444444444', '81111111-1111-4111-8111-111111111111', '73333333-3333-4333-8333-333333333333', 'WORKER', 'PROJECT_COMPANY'),
  ('63333333-3333-4333-8333-333333333333', '82222222-2222-4222-8222-222222222222', '72222222-2222-4222-8222-222222222222', 'SUB_CONTRACTOR', 'PROJECT_COMPANY');

select is(
  (select participation_type from public.project_companies
    where project_id = '81111111-1111-4111-8111-111111111111'
      and tenant_id = '71111111-1111-4111-8111-111111111111'),
  'MAIN_CONTRACTOR',
  'a new project registers its owning tenant as MAIN_CONTRACTOR'
);

select throws_ok(
  $$insert into public.project_memberships (user_id, project_id, tenant_id, role, scope) values
    ('64444444-4444-4444-8444-444444444444', '82222222-2222-4222-8222-222222222222', '73333333-3333-4333-8333-333333333333', 'WORKER', 'PROJECT_COMPANY')$$,
  '23503', null, 'a company not taking part in the project cannot get a membership there'
);

select throws_ok(
  $$insert into public.project_companies (project_id, tenant_id, participation_type) values
    ('81111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222', 'SUBCONTRACTOR')$$,
  '23505', null, 'a company joins a project only once'
);

select throws_ok(
  $$insert into public.project_memberships (user_id, project_id, tenant_id, role, scope) values
    ('63333333-3333-4333-8333-333333333333', '81111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222', 'WORKER', 'BAD_SCOPE')$$,
  '23514', null, 'scope is restricted to COMPANY, PROJECT_COMPANY or PROJECT'
);

select throws_ok(
  $$insert into public.project_companies (project_id, tenant_id, participation_type) values
    ('82222222-2222-4222-8222-222222222222', '73333333-3333-4333-8333-333333333333', 'BAD_TYPE')$$,
  '23514', null, 'participation type is restricted'
);

select is(
  (select count(distinct role)::bigint from public.project_memberships
    where user_id = '63333333-3333-4333-8333-333333333333'),
  2::bigint,
  'one user holds different roles in different projects'
);

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"62222222-2222-4222-8222-222222222222","role":"authenticated","app_role":"SUB_CONTRACTOR","tenant_id":"72222222-2222-4222-8222-222222222222"}', true);

select is(
  (select count(*) from public.project_memberships where project_id = '81111111-1111-4111-8111-111111111111'),
  1::bigint,
  'subcontractor admin sees only its own membership, not colleagues of the same company'
);

select is(
  (select count(*) from public.project_memberships where project_id = '82222222-2222-4222-8222-222222222222'),
  0::bigint,
  'subcontractor admin sees nothing in a project it is not a member of'
);

select is(
  (select count(*) from public.project_companies where project_id = '82222222-2222-4222-8222-222222222222'),
  0::bigint,
  'project companies of another project are hidden'
);

select is(
  (select count(*) from public.project_companies where project_id = '81111111-1111-4111-8111-111111111111'),
  3::bigint,
  'project members see all companies taking part in the project'
);

select set_config('request.jwt.claims', '{"sub":"61111111-1111-4111-8111-111111111111","role":"authenticated","app_role":"SITE_MANAGER","tenant_id":"71111111-1111-4111-8111-111111111111"}', true);

select is(
  (select count(*) from public.project_memberships where project_id = '81111111-1111-4111-8111-111111111111'),
  4::bigint,
  'main contractor site manager sees memberships of every company in the project'
);

select is(
  (select count(*) from public.project_memberships where project_id = '82222222-2222-4222-8222-222222222222'),
  2::bigint,
  'main contractor sees all memberships of its own project two'
);

select set_config('request.jwt.claims', '{"sub":"64444444-4444-4444-8444-444444444444","role":"authenticated","app_role":"WORKER","tenant_id":"73333333-3333-4333-8333-333333333333"}', true);

select is(
  (select count(*) from public.project_memberships where project_id = '81111111-1111-4111-8111-111111111111'),
  1::bigint,
  'worker of another company sees only its own membership'
);

select set_config('request.jwt.claims', '{"sub":"63333333-3333-4333-8333-333333333333","role":"authenticated","app_role":"WORKER","tenant_id":"72222222-2222-4222-8222-222222222222"}', true);

select is(
  (select count(*) from public.project_memberships where project_id = '81111111-1111-4111-8111-111111111111'),
  1::bigint,
  'worker of the subcontractor does not see colleagues of the same company'
);

select throws_ok(
  $$insert into public.project_memberships (user_id, project_id, tenant_id, role, scope) values
    ('64444444-4444-4444-8444-444444444444', '81111111-1111-4111-8111-111111111111', '73333333-3333-4333-8333-333333333333', 'WORKER', 'PROJECT_COMPANY')$$,
  '42501', null, 'authenticated users cannot write project memberships directly'
);

select * from finish();
rollback;
