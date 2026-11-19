# ADR-007: Layered authorization (roles → permissions → policies → RLS)

## Status

Accepted

## Context

Authorization must work identically on Web, Mobile and API/DB. A single
check for `user_id` is insufficient; the chain is
`User → Membership → Organization → Project → Role → Permission → Policy → Resource`.

## Decision

- `packages/auth` defines **roles**, **permissions**, **policies** (role→permission
  matrix) and **guards** (frontend/application checks).
- PostgreSQL enforces the same matrix through seeded role/permission tables and
  RLS policies.
- Sensitive capabilities (`safety.approve`, `incident.approve`, `report.export`)
  are expressed as explicit permissions.
- Frontend guards are UX convenience; RLS remains the security layer.

## Alternatives

- A single `role` claim checked ad-hoc (rejected: no fine-grained permission, drift risk).
- Attribute-based authorization on every request (rejected: complexity for current scope).

## Consequences

- One source of truth for semantics (TS package + SQL seed) with tests keeping
  both in sync.
- New capabilities require a permission key, a policy mapping and an RLS test.

## Security Impact

Layered checks mean a UI bug cannot expose data; only RLS bypass could.

## Migration Impact

`roles` / `permissions` / `role_permissions` are reference tables seeded from
`supabase/seed/*.sql`; no application data migration.