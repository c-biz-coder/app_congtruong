import type { Worker } from '@partner-os/domain';
import type { OperationType } from '@partner-os/sync-engine';

/**
 * The mobile-local persistence boundary. UI components never touch
 * WatermelonDB directly; they go through repositories that implement these
 * contracts.
 */
export interface LocalOutboxRecord {
  operationId: string;
  deviceId: string;
  recordType: string;
  recordId: string;
  operation: OperationType;
  payload: string;
  version: number;
  retryCount: number;
  lastError: string | null;
  status: 'pending' | 'failed' | 'committed';
  createdAt: number;
}

export interface LocalSyncOutboxStore {
  enqueue(record: LocalOutboxRecord): Promise<void>;
  pending(limit?: number): Promise<LocalOutboxRecord[]>;
  markCommitted(operationId: string): Promise<void>;
  markFailed(operationId: string, error: string): Promise<void>;
}

/** Minimal local CRUD that WatermelonDB-backed stores implement per entity. */
export interface LocalStore<TRecord, TId extends string = string> {
  list(): Promise<TRecord[]>;
  findById(id: TId): Promise<TRecord | null>;
  insert(record: TRecord): Promise<void>;
  update(id: TId, patch: Partial<TRecord>): Promise<TRecord>;
  remove(id: TId): Promise<void>;
  /** Local version of the record; null when the record is unknown. */
  versionOf(id: TId): Promise<number | null>;
}

export interface RemoteWorkerWrite {
  worker: Worker;
  version: number;
  deleted: boolean;
}

export interface LocalWorkerStore extends LocalStore<Worker> {
  /** Writes a server-confirmed row locally without queueing it for push. */
  applyRemote(write: RemoteWorkerWrite): Promise<void>;
}

export interface LocalDatabase {
  outbox: LocalSyncOutboxStore;
}

export { createWatermelonDatabase } from './watermelon';
