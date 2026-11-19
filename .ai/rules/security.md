# Security Rules

## Layered authorization — never frontend alone
```
Frontend Guard  +  Application Authorization  +  PostgreSQL RLS
```

## Database
- `ENABLE ROW LEVEL SECURITY` on every business table.
- Policies isolate by `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.
- Least privilege: INSERT/UPDATE/DELETE are role-gated.
- Sensitive tables (incidents, payroll, approvals) get RLS tests in
  `supabase/tests/rls/`.

## Code
- Never hard-code Supabase URL, API keys, tokens, or credentials.
- Everything comes from `.env` / `.env.local`; `.env.example` holds placeholders.
- Never log secrets, access tokens or PII.
- Never ship the service-role key to a client. Service-role credentials are
  trusted-server-only.
- Validate every boundary crossing (API, local DB, sync queue, external
  integration, user input) with Zod from `@partner-os/contracts`.

## Audit
Approve/reject/export/permission changes and security-sensitive actions are
audited (who/what/when/context/old-new). Audit logs are append-only, not CRUD.