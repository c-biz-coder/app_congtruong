# Security Overview

## Backbone: layered authorization

```
Frontend Guard (packages/auth guards)
+ Application Authorization (policies)
+ PostgreSQL RLS (supabase/migrations + tests/rls)
```

Frontend guard is UX; RLS is the boundary. Service-role credentials are
trusted-server-only and never shipped to clients.

## Database security

- Every business table: `tenant_id NOT NULL` + index + RLS enabled.
- SELECT policies isolate by `(auth.jwt() ->> 'tenant_id')::uuid`.
- INSERT/UPDATE/DELETE are role-gated (least privilege).
- Sensitive tables (incidents, payroll, approvals) have RLS tests.
- Reference data (`roles`, `permissions`) is read-only; SYS_ADMIN-only writes.

## Client security

- No hard-coded secrets. All env from `.env*`; `.env.example` has placeholders.
- `pnpm validate:env` warns on missing/placeholder values; `--strict` fails CI.
- Never log tokens, secrets or PII. Audit sensitive actions.

## Audit

Approve/reject/export/permission/role changes and security-sensitive actions are
recorded append-only (who, what, when, context, resource, old/new).

## Threat notes

- Cross-tenant reads/writes: blocked by RLS + verified in `supabase/tests/rls/`.
- Stale offline device writes: blocked by VERSION_CHECK / SERVER_WINS strategies
  (see ADR-005).
- Compromised UI: cannot read other tenants because RLS filters at the DB.