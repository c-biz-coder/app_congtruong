# ADR-006: Multi-tenancy designed from the database

## Status

Accepted

## Context

Contractors A and B share the platform; financial, worker and incident data must
never leak between tenants.

## Decision

Every tenant-sensitive table carries `tenant_id uuid not null`. RLS policies
reference it via `(auth.jwt() ->> 'tenant_id')::uuid`. Membership links
`auth.users ↔ tenants` with a role. Project-scoped data also carries
`project_id`/`organization_id`. UI/application checks are additive; database
RLS is the enforcement boundary.

## Alternatives

- Postgres schemas per tenant (rejected: migration/ops complexity, no benefit here).
- App-layer filtering only (rejected: leaks data, contradicts RLS mandate).

## Consequences

- New tables require tenant boundary + RLS + indexes + tests before merging.
- SYS_ADMIN bypasses tenant scoping deliberately and only for system reference data.

## Security Impact

Isolation failures become impossible in normal flows; cross-tenant writes are
denied by policy (verified by `supabase/tests/rls/`).

## Migration Impact

Every future business table must follow the pattern; destructive migration needs
special review.