import type { SyncCursor } from '../cursor/cursor';
import type { SyncAuditEntry } from '../audit/audit';

export interface SyncStats {
  pushed: number;
  pulled: number;
  conflicts: number;
  retries: number;
  errors: number;
}

export const EMPTY_SYNC_STATS: SyncStats = {
  pushed: 0,
  pulled: 0,
  conflicts: 0,
  retries: 0,
  errors: 0,
};

/**
 * The offline-first sync engine contract. Implementations bridge the local
 * database outbox to the remote transport. The engine itself must stay
 * framework-agnostic (no WatermelonDB / Supabase imports here).
 */
export interface SyncEngine {
  /** Push pending outbox records and apply pulled remote records. */
  flush(recordType?: string): Promise<SyncStats>;
  /** Pull new remote changes since the given cursor and return the advanced cursor. */
  pull(cursor: SyncCursor | null): Promise<SyncCursor>;
  emitAudit(entry: SyncAuditEntry): void;
  subscribe(listener: (entry: SyncAuditEntry) => void): () => void;
}
