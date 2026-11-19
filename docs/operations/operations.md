# Operations

## Observability targets (contract §36)

Track in production: errors, crashes, performance, API latency, sync success,
sync failure, queue size, retry count, conflict count, last sync time.

Suggested shape:

```
Application → Observability → Logging
                            ├→ Error Tracking
                            ├→ Metrics
                            └→ Alerts
```

Never log sensitive data or tokens. The sync engine emits audit entries
(`@partner-os/sync-engine/audit`) that can drive metrics.

## CI/CD pipeline (contract §38)

```
PR → Install → Lint → Typecheck → Unit → Integration → Architecture Guard →
Build → E2E → Security/RLS → PASS
```

Workflows: `.github/workflows/build-test.yml`, `architecture-check.yml`,
`deploy.yml`. A PR is not mergeable if any gate fails.

## Local Supabase

```bash
supabase start        # runs migrations + seed
supabase test db      # runs RLS/function tests
pnpm db:generate-types
pnpm database-reset
```

## Deployment notes

- Web admin: build `apps/web` (Vite `dist/`) and host (TODO: pick target —
  Supabase Hosting, Vercel, S3+CDN).
- Mobile: EAS builds (EAS_CLI_PROJECT_ID / secrets required) — workflow stub in
  `deploy.yml`.
- Env per environment via `.env.*`, validated by `pnpm validate:env`.
- Migrations are applied only via new ordered files; destructive changes need
  special review.

## Runbook style commands

```bash
pnpm install
pnpm dev              # turbo dev (web) — start mobile separately with pnpm --filter @partner-os/mobile dev
pnpm lint
pnpm typecheck
pnpm test
pnpm architecture:check
pnpm build
```