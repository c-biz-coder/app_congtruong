# Partner OS — AI Agents Context

The governing document is
[`docs/PARTNER_OS_ARCHITECTURE_AI_CODING_CONTRACT.md`](docs/PARTNER_OS_ARCHITECTURE_AI_CODING_CONTRACT.md).
Every change must respect that contract. Detailed role/rules/checklists live
under [`.ai/`](.ai/).

## Repo shape

```
apps/        web (React+Vite+Tailwind) · mobile (React Native+Expo+WatermelonDB)
packages/    domain · contracts · auth · sync-engine · database · shared-utils · i18n · ui
supabase/    migrations · functions · seed · tests (RLS) · config.toml
scripts/     architecture guard, dependency check, env check, type generation, DB reset
docs/        architecture · adr · product · security · testing · operations
.ai/         agents · rules · handover
```

- `packages/domain` is framework-free (no React, Supabase, WatermelonDB).
- `packages/contracts` holds Zod schemas validating every boundary crossing.
- Mobile writes are local-first (WatermelonDB + outbox); the sync engine pushes.
- Multi-tenancy is enforced by PostgreSQL RLS, never by the frontend alone.
- No God Package: each package has one responsibility and an `index.ts`.

## Agents

| Agent | owns |
| --- | --- |
| Architect | `docs/`, ADRs, tracker, architecture guard |
| DBAgent | `supabase/**`, `packages/database`, schema/RLS |
| CoreAgent | `packages/domain`, `contracts`, `auth`, `sync-engine`, `shared-utils`, `i18n`, `ui` |
| WebAgent | `apps/web/**` |
| MobileAgent | `apps/mobile/**` |

Roles and allowed/forbidden scopes: see `.ai/agents/*.md`.

## Verification (gate before "done")

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm architecture:check
pnpm build
# RLS tests once a local DB is up: supabase test db
```

## AI response format

Report every finished task with: TASK · STATUS (DONE/PARTIAL/BLOCKED) · FILES
CHANGED · ARCHITECTURE/DATABASE/SECURITY IMPACT · TESTS · ARCHITECTURE CHECK ·
KNOWN ISSUES · NEXT STEP. Never claim DONE without running the verification
above.