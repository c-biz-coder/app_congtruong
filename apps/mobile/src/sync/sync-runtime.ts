import { WorkerSchema } from '@partner-os/contracts';
import {
  createSyncEngine,
  type OutboxRecord,
  type PullBatch,
  type SyncCursor,
  type SyncOutboxPort,
  type SyncTransport,
} from '@partner-os/sync-engine';
import type { LocalSyncOutboxStore, LocalWorkerStore, RemoteWorkerWrite } from '../database';

const WORKER_RECORD_TYPE = 'worker';
const MAX_PULL_PAGES = 100;

export interface CursorStore {
  read(): Promise<SyncCursor | null>;
  write(cursor: SyncCursor): Promise<void>;
}

export interface WorkerSyncRuntimeDeps {
  outbox: LocalSyncOutboxStore;
  workers: LocalWorkerStore;
  transport: SyncTransport;
  cursorStore: CursorStore;
}

export interface WorkerSyncRuntime {
  /** Pushes pending local writes, then pulls remote changes. Concurrent calls share one run. */
  syncNow(): Promise<void>;
}

export function toSyncOutboxPort(store: LocalSyncOutboxStore): SyncOutboxPort {
  return {
    async pending(limit) {
      const records = await store.pending(limit);
      return records.map((record): OutboxRecord<unknown> => ({
        operationId: record.operationId,
        deviceId: record.deviceId,
        recordType: record.recordType,
        recordId: record.recordId,
        operation: record.operation,
        payload: JSON.parse(record.payload) as unknown,
        version: record.version,
        clientTimestamp: new Date(record.createdAt).toISOString(),
        retryCount: record.retryCount,
        lastError: record.lastError,
        status: 'pending',
        createdAt: new Date(record.createdAt).toISOString(),
      }));
    },
    markCommitted: (operationId) => store.markCommitted(operationId),
    markFailed: (operationId, error) => store.markFailed(operationId, error),
  };
}

function parseRemoteWorker(payload: unknown): RemoteWorkerWrite['worker'] & { deleted: boolean } {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Remote worker payload must be an object');
  }
  const { worker, deleted } = payload as { worker: unknown; deleted: unknown };
  return { ...WorkerSchema.parse(worker), deleted: deleted === true };
}

/**
 * Applies a pulled batch locally. A record that still has a pending local
 * write is skipped: the local change is pushed first and wins until the server
 * acknowledges it.
 */
async function applyRemoteBatch(
  batch: PullBatch,
  outbox: SyncOutboxPort,
  workers: LocalWorkerStore,
): Promise<void> {
  const pendingIds = new Set((await outbox.pending()).map((record) => record.recordId));

  for (const record of batch.records) {
    if (pendingIds.has(record.recordId)) continue;
    const { deleted, ...worker } = parseRemoteWorker(record.payload);
    await workers.applyRemote({ worker, version: record.version, deleted });
  }
}

export function createWorkerSyncRuntime(deps: WorkerSyncRuntimeDeps): WorkerSyncRuntime {
  const outbox = toSyncOutboxPort(deps.outbox);
  const engine = createSyncEngine({
    outbox,
    transport: deps.transport,
    applyRemote: (batch) => applyRemoteBatch(batch, outbox, deps.workers),
  });

  async function run(): Promise<void> {
    await engine.flush(WORKER_RECORD_TYPE);

    let cursor = await deps.cursorStore.read();
    for (let page = 0; page < MAX_PULL_PAGES; page += 1) {
      const next = await engine.pull(cursor);
      if (next === cursor) return;
      await deps.cursorStore.write(next);
      cursor = next;
    }
  }

  let inFlight: Promise<void> | null = null;

  return {
    syncNow() {
      if (!inFlight) {
        inFlight = run().finally(() => {
          inFlight = null;
        });
      }
      return inFlight;
    },
  };
}
