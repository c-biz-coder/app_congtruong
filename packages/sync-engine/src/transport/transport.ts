import type { OutboxRecord } from '../outbox/outbox';
import type { SyncCursor } from '../cursor/cursor';

export interface PushResult {
  acknowledged: boolean;
  serverVersion: number;
}

export interface PullBatch {
  cursor: SyncCursor;
  records: Array<{ recordId: string; payload: unknown; version: number }>;
}

export interface PullRequest {
  cursor: SyncCursor | null;
  recordType?: string;
  limit?: number;
}

/**
 * The sync transport abstracts the network boundary. Supabase over HTTPS is the
 * first implementation; the engine only depends on this interface.
 */
export interface SyncTransport {
  push<TRecord>(operationId: string, record: OutboxRecord<TRecord>): Promise<PushResult>;
  pull(request: PullRequest): Promise<PullBatch>;
}
