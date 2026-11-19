-- 006. Optimistic-concurrency version for workers so the sync transport can
-- reject stale offline writes (VERSION_CHECK strategy). updated_at (set by the
-- existing workers_set_updated_at trigger) is the pull cursor.

alter table public.workers
  add column if not exists version integer not null default 1 check (version >= 1);

create index if not exists idx_workers_tenant_updated_at on public.workers (tenant_id, updated_at);
