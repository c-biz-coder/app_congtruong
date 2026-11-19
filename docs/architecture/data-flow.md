# Data Flow & Sync

## Web Admin (online-first)

```
Component → Feature → Application Service → Repository → Supabase Adapter → PostgreSQL (RLS)
```

## Mobile Field App (offline-first)

```
UI → Feature → Application Service → Repository
                                       ├→ Local WatermelonDB (read + write)
                                       └→ Sync Engine
                                             ├→ Outbox (queue pending writes)
                                             ├→ Retry (exponential backoff)
                                             ├→ Conflict resolution (per record type)
                                             └→ Transport (HTTPS) → Supabase (RLS)
```

Offline:

```
Local DB → Outbox → Retry Queue
```

Reconnected:

```
Retry Queue → Sync Engine → Supabase
```

## Sync metadata

Records that sync carry: `id, tenant_id, project_id? , created_at, updated_at,
created_by, updated_by, version, sync_status, deleted_at`. The outbox adds:
`operation_id, device_id, client_timestamp, server_timestamp, sync_cursor,
retry_count, last_error`. Only add columns when a real business/technical need
exists — never preemptively on every table (contract §17).

## Conflict strategy (contract §16)

- UI preferences → LWW
- Checklist / inspection → version + conflict handling
- Incident record → VERSION_CHECK, never silent overwrite
- Approval → business rule, SERVER_WINS
- Audit log → append-only