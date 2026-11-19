# ADR-005: Conflict resolution strategy per record type

## Status

Accepted

## Context

Offline edits on different devices converge later. A blanket Last-Write-Wins
policy would silently overwrite safety incidents, inspections and approvals.

## Decision

Conflict resolution strategy is **data-type dependent**, never LWW-by-default:

- UI preferences → **LWW**
- Inspections / checklists → version + conflict handling
- Incident records → **VERSION_CHECK** (never silent overwrite)
- Approvals → **SERVER_WINS** (business rule)
- Audit logs → append-only

Records carry `version`; the outbox carries `client_timestamp`; unresolved
conflicts surface a `MANUAL` resolution path in `packages/sync-engine/conflict`.

## Alternatives

- LWW everywhere (rejected: corrupts safety records).
- Full CRDT for all data (rejected: over-engineering, needs separate ADR).

## Consequences

- Sync engine must expose conflict events the UI can render.
- New record types must explicitly pick a strategy.

## Security Impact

Incidents/approvals cannot be tampered with via a stale device write.

## Migration Impact

Adds `version` to synced tables; migration planning follows the contract §17.