-- Shared SQL test helpers.
-- These tests are executed against the Supabase shadow database on commit
-- (e.g. `supabase test db`). They are self-asserting: any failed assertion
-- raises an exception and fails the run.
create schema if not exists tests;

create or replace function tests.assert_true(condition boolean, message text)
returns void
language plpgsql as $$
begin
  if condition is false then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
end;
$$;

-- Simulate the JWT claims a logged-in user would have (top-level `role` is
-- always "authenticated" in Supabase; the app role is in `app_role`).
-- Transaction-local so assertions stay isolated per test block.
create or replace function tests.set_jwt(
  app_role text,
  uid text,
  tenant_id text,
  email text
)
returns void
language sql as $$
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', uid,
      'role', 'authenticated',
      'app_role', app_role,
      'tenant_id', tenant_id,
      'email', email
    )::text,
    true
  );
$$;

-- Passes when the statement fails with a permission or constraint error.
create or replace function tests.assert_denied(stmt text, message text)
returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'ASSERTION FAILED: %', message;
exception
  when insufficient_privilege or check_violation or foreign_key_violation then
    return;
end;
$$;

-- Self-check of the helpers above so this file emits a valid TAP plan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select lives_ok(
  $$select tests.assert_true(true, 'holds')$$,
  'assert_true passes on a true condition'
);
select throws_ok(
  $$select tests.assert_true(false, 'boom')$$,
  'P0001',
  'ASSERTION FAILED: boom',
  'assert_true raises on a false condition'
);
select throws_ok(
  $$select tests.assert_denied('select 1', 'not denied')$$,
  'P0001',
  'ASSERTION FAILED: not denied',
  'assert_denied fails when the statement succeeds'
);

select * from finish();
rollback;

-- Passes when an UPDATE/DELETE is denied, either by error or by matching 0 rows.
create or replace function tests.assert_mutation_blocked(stmt text, message text)
returns void
language plpgsql as $$
declare
  affected integer;
begin
  execute stmt;
  get diagnostics affected = row_count;
  if affected > 0 then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
exception
  when insufficient_privilege or check_violation or foreign_key_violation then
    return;
end;
$$;