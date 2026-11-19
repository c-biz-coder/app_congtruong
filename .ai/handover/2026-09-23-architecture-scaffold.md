# HANDOVER — Architectural re-alignment to the AI Coding Contract

## Agent

Architect (full-scope scaffold pass)

## Task

Review `docs/PARTNER_OS_ARCHITECTURE_AI_CODING_CONTRACT.md` against the existing
codebase and fix/adjust the workspace to conform to it (split the forbidden
`shared-core` God Package, fix Supabase migrations, add tooling/guards/scripts,
scaffold web+mobile, migrate governance to `.ai/`, restructure docs + ADRs).

## Completed

- Removed `packages/shared-core` (God Package) and `packages/shared-ui`.
- Created the 8 contract packages: `domain`, `contracts`, `auth`, `sync-engine`,
  `database`, `shared-utils`, `i18n`, `ui` — each with own `index.ts`, single
  responsibility, real source + unit tests.
- Migrated `roles.ts` → `packages/auth/src/roles` and `worker.schema.ts` →
  `packages/contracts/src/schemas/worker.schema.ts`.
- Root tooling: `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`,
  `.env.example`, `turbo.json` tasks, root scripts (contract §39 verbs).
- `scripts/`: `check-architecture.ts` (Architecture Guard), `check-dependencies.ts`,
  `validate-env.ts`, `generate-types.ts`, `database-reset.ts`, `verify-build.ts`.
- Supabase: replaced broken RLS migration with 3 ordered migrations (rbac,
  tenancy, workers), seed split into `roles/permissions/role_permissions/demo`,
  `seed.sql` aggregator, RLS test scaffolding + helpers, `config.toml`.
- Scaffolded `apps/web` (Vite+React+Tailwind, builds) and `apps/mobile`
  (Expo+RN+WatermelonDB schema, typechecks).
- CI: `.github/workflows/{build-test,deploy,architecture-check}.yml`.
- Governance: `.ai/agents/*`, `.ai/rules/*`, `.ai/handover/template.md`;
  removed `AI-GOVERNANCE/`; added root `AGENTS.md`.
- Docs restructured: `docs/{architecture,adr,product,security,testing,operations}`
  + 7 ADRs; `3_TRACKER.md` updated; README rewritten.

## Files Changed

- Deleted: `packages/shared-core/**`, `packages/shared-ui/`, `AI-GOVERNANCE/**`,
  `supabase/migrations/20260921061040_create_rls_policies.sql`,
  `docs/{0_ARCHITECTURE,1_PRD,2_TECH_SPEC,4_HANDOVER}.md`.
- New: 8 packages, `apps/web`, `apps/mobile`, `scripts/*`, `.github/workflows/*`,
  `.ai/**`, `docs/{architecture,adr,product,security,testing,operations}/**`,
  root `AGENTS.md`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`,
  `.env.example`, `vitest.config.ts`, `vitest.e2e.config.ts` (full list in git diff).
- Modified: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `README.md`,
  `.gitignore`, `docs/3_TRACKER.md`.

## Architecture Impact

Yes — this *is* the architecture change: contract layers now enforceable.
Domain layer is framework-free; packages never import apps; web≠mobile
boundaries enforced by the guard.

## Database Impact

Yes — new ordered migrations + RLS policies + seed split. The old bootstrap
migration (references `public.workers` without the table) was removed because it
was never applied; new migrations create tables first.

## API/Contract Impact

Yes — `WorkerSchema` moved to `@partner-os/contracts`; `UserRole` moved to
`@partner-os/auth`; new DTO/API/event contracts added.

## Security Impact

Yes — RLS isolation is now backed by real tables + seed role/permission matrix +
RLS test scaffolding; secrets policy documented; no service-role leakage.

## Tests

- `pnpm lint` → PASS (0)
- `pnpm typecheck` → PASS (0) (10 packages incl. web + mobile)
- `pnpm test` → PASS (35 tests, 11 files)
- `pnpm test:e2e` → PASS (1 skipped: needs live Supabase env)
- `pnpm architecture:check` → PASS (0)
- `pnpm check:dependencies` → PASS
- `pnpm build` → PASS (web `dist/` produced; libs tsc-verified)
- RLS SQL tests not executed (requires `supabase start` + `supabase test db`).

## Known Issues

- **Mobile app runtime not verified** — only TypeScript is checked. Expo dev
  build/native (Metro, WatermelonDB adapter wiring, app.json feeds) still needs a
  device/emulator pass; Watermelon repositories are interface-only.
- **Supabase tests not run** — no local Supabase instance/CLI in this pass;
  `supabase/tests/rls/*.test.sql` are written but not executed.
- **e2e** skips until `SUPABASE_URL` env is set.
- `pnpm validate:env` reports placeholder keys unless `--strict` (expected).
- Root `package.json` `pnpm.onlyBuiltDependencies` moved to
  `pnpm-workspace.yaml` `allowBuilds.esbuild` (pnpm 12 setting relocation).

## Next Agent

CoreAgent (recommended next) or DBAgent.

## Recommended Next Step

1. `supabase start` → run `pnpm db:generate-types` → `supabase test db` to
   validate migrations + RLS tests.
2. Then implement the first vertical slice (Module 2 — Worker): DBAgent extends
   schema → CoreAgent application service + repository interface →
   WebAgent/MobileAgent wire a real `WorkersList` screen through the repository.