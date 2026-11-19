# HANDOVER — Worker (Module 2) vertical slice

## Agent

CoreAgent + WebAgent + MobileAgent (coordinated by Architect)

## Task

Continue the roadmap: build the first end-to-end vertical slice (Module 2 —
Worker) on top of the contract-aligned scaffold. DB runtime is blocked (no
Supabase CLI / Docker on this machine), so the slice is code-complete at every
layer with pure-logic tests; DB-backed adapters are wired but require `.env` +
Supabase to run.

## Completed

- **domain** (`@partner-os/domain`): worker status transition rules
  (`rules/worker-status.ts`) + `updateWorkerStatus` service + tests.
- **database** (`@partner-os/database`): `WorkerRepository` interface +
  `WORKER_STATUS_FILTERS`; new dependency on `@partner-os/domain`.
- **web** (`apps/web`): full workers feature —
  - `shared/supabase/client.ts` (lazy Supabase client; throws
    `SupabaseNotConfiguredError` when unconfigured),
  - `shared/config/env.ts` gains `demoTenantId`,
  - `features/workers/api/supabaseWorkerApi.ts` (Postgres adapter, snake_case
    mapping, soft-delete),
  - `features/workers/services/worker-application.ts` (Zod-boundary use-cases),
  - `features/workers/store/workersStore.ts` (Zustand facade + tests),
  - `features/workers/pages/WorkersListPage.tsx` wired into `App.tsx`.
- **mobile** (`apps/mobile`): offline slice —
  - `database/index.ts`: `LocalStore<T>` + `LocalOutboxRecord.deviceId/lastError`,
  - `features/workers/database/localWorkerRepository.ts` (local write →
    outbox enqueue via `@partner-os/sync-engine`),
  - `features/workers/services/offline-worker.ts` (validate → domain-check →
    local store → outbox) + tests,
  - `features/workers/pages/WorkersListPage.tsx` in `App.tsx` (reads via injected
    repository; honest "not wired" state until WatermelonDB connection lands).
- **tests**: `tests/integration/worker-use-case.test.ts` (fake adapter);
  vitest now includes `apps/mobile/src/**/*.test.ts`.

## Files Changed

- New: `packages/domain/src/rules/worker-status.ts` (+ `.test.ts`),
  `packages/database/src/repositories/worker-repository.ts`,
  `apps/web/src/shared/supabase/client.ts`,
  `apps/web/src/features/workers/{api,services,store,pages}/*`,
  `apps/mobile/src/features/workers/{database,services,pages}/*`,
  `tests/integration/worker-use-case.test.ts`.
- Modified: `packages/domain/src/services/worker-service.ts`, `src/index.ts`,
  `packages/database/package.json`, `src/index.ts`,
  `apps/web/package.json`, `.env.example`, `src/app/App.tsx`,
  `apps/mobile/package.json`, `src/database/index.ts`, `src/app/App.tsx`,
  `vitest.config.ts`, `docs/3_TRACKER.md`.

## Architecture Impact

Yes — establishes the canonical vertical slice template: Feature → Application
service → Repository (interface in `packages/database`) → adapter (Supabase/Watermelon).
Domain stays framework-free; all boundaries validated by contracts.

## Database Impact

Yes (code-level) — `WorkerRepository` interface; DB RLS/migrations unchanged.
Actual DB execution pending (`supabase start`).

## API/Contract Impact

No new schema; uses existing `CreateWorkerInput` / `WorkerListQuery` /
`WorkerApi`.

## Security Impact

No RLS changes. Env-guarded Supabase client; tenant id still must come from the
session (currently `VITE_DEMO_TENANT_ID` for the quickstart list).

## Tests

- `pnpm lint` PASS
- `pnpm typecheck` PASS (10 packages incl. web + mobile)
- `pnpm test` PASS — 46 tests / 15 files
- `pnpm architecture:check` PASS
- `pnpm build` PASS (web `dist/` produced)
- E2E & RLS SQL still blocked by missing Supabase CLI/Docker.

## Known Issues

- Supabase/WatermelonDB runtime not exercised (no CLI/Docker): `VITE_SUPABASE_*`
  unset → web list shows the "not configured" error (by design).
- Mobile `WorkersListPage` receives `repository={null}` until the WatermelonDB
  connection + session are wired.
- `VITE_DEMO_TENANT_ID` is a dev fixture; replace with session tenant id once
  Module 1 (Auth) lands.

## Next Agent

DBAgent (start `sub_contractors` + HRM columns) or CoreAgent (auth session store,
Module 1) — pick the next vertical.

## Recommended Next Step

1. On a machine with Supabase CLI + Docker: `supabase start`, set
   `VITE_DEMO_TENANT_ID`, and verify `supabaseWorkerApi` against real RLS.
2. Then Module 1 (Auth & Onboarding): session store + tenant scoping so the
   list page stops using the demo tenant id.