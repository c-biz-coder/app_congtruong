# ADR-004: WatermelonDB as the Mobile local database

## Status

Accepted

## Context

Mobile needs a reactive, performant SQLite-backed local store for offline-first
behaviour without reimplementing sync primitives.

## Decision

**WatermelonDB** is the local database implementation used only inside
`apps/mobile`. It is accessed through repository adapters; the domain and sync
engine depend on interfaces, never on WatermelonDB.

## Alternatives

- Realm (rejected: license/maintenance concerns).
- SQLite raw + custom reactive layer (rejected: re-inventing the wheel).
- MMKV/AsyncStorage (rejected: unsuitable for relational query sets).

## Consequences

- Fast local reads/writes with an observable query layer.
- Watermelon's `appSchema`/models stay in `apps/mobile/src/database`.
- Repository pattern keeps the rest of the system framework-agnostic.

## Security Impact

Local DB holds PII; the device's secure storage is used for tokens, and schema
columns are minimized to what sync requires.

## Migration Impact

Watermelon migrations live in `apps/mobile/src/database/migrations/` keyed by
schema version.