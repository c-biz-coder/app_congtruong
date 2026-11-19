# ADR-002: Supabase + PostgreSQL as the server source of truth

## Status

Accepted

## Context

The system needs a managed Postgres with auth, realtime and row-level security
without running our own backend fleet.

## Decision

**Supabase** (PostgreSQL) is the server-side data source. Row Level Security is
mandatory on every business table. Edge Functions handle server-side logic
(e.g. notifications). No alternative backend framework is introduced to "make
coding easier".

## Alternatives

- Firebase (rejected: per-operation pricing, weaker relational/RLS model).
- Self-hosted Postgres + custom auth (rejected: ops cost).

## Consequences

- Multi-tenancy and authorization live in SQL policies — hard to bypass.
- Teams must write and test RLS; UI authorization is only a convenience layer.

## Security Impact

RLS is the security backbone. Service-role credentials never reach clients;
`auth.jwt()` claims drive tenant isolation.

## Migration Impact

Migrations under `supabase/migrations/` are ordered and immutable once applied.
New changes are always new files.