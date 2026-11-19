# Testing Strategy

## Layers

| Layer | Scope | Where | Run |
| --- | --- | --- | --- |
| Unit | domain rules, calc, validation, pure functions | `**/*.test.ts` next to source | `pnpm test` |
| Integration | repository, DB, sync, API, auth/authorization | `tests/integration/` | `pnpm test` |
| E2E | full journey incl. offline→sync | `tests/e2e/` (needs live Supabase, skips otherwise) | `pnpm test:e2e` |
| RLS/Security | tenant isolation + permissions | `supabase/tests/rls/` | `supabase test db` |

## Unit / integration tooling

- **Vitest** at the workspace root (`vitest.config.ts`). Example suites:
  - `packages/domain/src/rules/worker-code.test.ts`
  - `packages/contracts/src/schemas/worker.schema.test.ts`
  - `packages/auth/src/guards/index.test.ts`
  - `packages/sync-engine/src/retry/retry.test.ts`
  - `tests/integration/sync-engine-flow.test.ts`

## E2E journey

`Login → Select Organization → Select Project → Create Resource → Edit →
Offline → Reconnect → Sync → Verify`

## RLS test scaffolding

`supabase/tests/helpers.sql` provides `tests.assert_true(...)` and
`tests.set_jwt(role, uid, tenant_id, email)`. `supabase/tests/rls/*.test.sql`
cover: same-tenant read OK, other-tenant read blocked, weak role write blocked,
cross-tenant write blocked, manager write allowed.

## Quality gate

PRs cannot merge until: **lint**, **typecheck**, **unit+integration**,
**architecture:check**, **build** pass, and security/RLS tests are green whenever
the DB schema changes (`build-test.yml` + `architecture-check.yml`).