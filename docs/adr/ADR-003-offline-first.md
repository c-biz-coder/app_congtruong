# ADR-003: Offline-first architecture

## Status

Accepted

## Context

Sites have unreliable connectivity (basements, remote projects). Field workers
must keep reading, creating and editing data without a network; everything must
sync later without data loss or silent corruption.

## Decision

Offline is a first-class architecture, not a feature. Mobile reads and writes go
through a local database, writes are queued in an outbox, and a sync engine
drains the outbox with retry and conflict detection when connectivity returns.
App logic (domain + contracts + sync core) never depends on the network path.

## Alternatives

- Online-only with optimistic UI (rejected: loses work, violates field reality).
- Full offline replication via CRDT (rejected for now: complexity, no ADR).

## Consequences

- Every write path on Mobile must keep an audit trail and version.
- UI must expose network state (offline banners) and queue feedback.
- E2E test: `Login → create → offline → reconnect → sync → verify`.

## Security Impact

Outbox payloads may contain sensitive data; they stay local until RLS-validated
push. Sync requests always carry the user JWT.

## Migration Impact

Sync metadata columns are added only to entities that actually sync.