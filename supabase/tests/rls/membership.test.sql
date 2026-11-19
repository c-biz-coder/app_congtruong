begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

insert into public.roles (name) values ('SITE_MANAGER') on conflict do nothing;
insert into auth.users (id) values ('11111111-1111-4111-8111-111111111111');
insert into public.tenants (id, name, code) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tenant A', 'AUTH_TEST_A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tenant B', 'AUTH_TEST_B');
insert into public.memberships (user_id, tenant_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SITE_MANAGER');

select lives_ok(
  $$insert into public.memberships (user_id, tenant_id, role) values
    ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'SITE_MANAGER')$$,
  'a user can join a second tenant'
);
delete from public.memberships where tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  public.custom_access_token_hook(
    '{"user_id":"11111111-1111-4111-8111-111111111111","claims":{}}'::jsonb
  ) #>> '{claims,tenant_id}',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'access token contains the membership tenant'
);

select is(
  public.custom_access_token_hook(
    '{"user_id":"11111111-1111-4111-8111-111111111111","claims":{}}'::jsonb
  ) #>> '{claims,app_role}',
  'SITE_MANAGER',
  'access token contains the membership role'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","tenant_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","app_role":"SITE_MANAGER"}', true);
select is((select count(*) from public.tenants), 1::bigint, 'tenant isolation applies');
select is((select count(*) from public.memberships), 1::bigint, 'own membership is visible');

select * from finish();
rollback;
