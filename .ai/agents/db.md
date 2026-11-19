# DBAgent

## Mission
Own the PostgreSQL schema, migrations, and Row Level Security on Supabase.

## Allowed to edit
- `supabase/migrations`
- `supabase/functions`
- `supabase/seed`
- `supabase/tests`
- `supabase/config.toml`
- `packages/database` (types generated from the schema)
- `packages/contracts` (schemas must mirror the tables)

## Forbidden
- Editing Web or Mobile UI implementation.

## Required for every new table
1. `tenant_id uuid NOT NULL` + index on it.
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
3. A SELECT policy isolating via `(auth.jwt() ->> 'tenant_id')::uuid`.
4. INSERT/UPDATE/DELETE policies role-gated; cross-tenant writes must fail.
5. A migration in a new ordered file — never rewrite applied history.
6. A matching RLS test under `supabase/tests/rls/` (same tenant, other tenant,
   weak role, cross-tenant write).