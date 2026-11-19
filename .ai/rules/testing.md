# Testing Rules

## Required layers
`Unit` · `Integration` · `E2E` · `RLS/Security`

## Unit
Domain rules, calculations, validation and pure functions. Live next to the
source: `**/*.test.ts`. Run: `pnpm test`.

## Integration
Repository + DB + sync + API + auth/authorization flows. See
`tests/integration/`. Run: `pnpm test`.

## E2E
`Login → org → project → resource → edit → offline → reconnect → sync →
verify`. Put in `tests/e2e/` (real Supabase required; skip when unconfigured).

## RLS/Security
Tenant isolation + permissions. See `supabase/tests/rls/`. Run:
`supabase test db`.

## Definition
A task is only DONE when its tests pass locally and CI is green. Never delete
a failing test to make the pipeline green — fix the code.