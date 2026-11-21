import type { Attendance, Worker } from '@partner-os/domain';
import type { OperationType } from '@partner-os/sync-engine';

/**
 * The mobile-local persistence boundary. UI components never touch
 * WatermelonDB directly; they go through repositories that implement these
 * contracts.
 */
export interface LocalOutboxRecord {
  operationId: string;
  deviceId: string;
  /** Tenant the write was made under; fixed at creation and never rewritten. */
  tenantId: string;
  projectId: string | null;
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

/**
 * Unsynced = every record not yet committed by the server.
 * `failed` counts pending records that have a recorded error (retry scheduled).
 * `syncing` is in-flight only and is not persisted, so it is not a stored state.
 */
export interface UnsyncedCount {
  pending: number;
  failed: number;
  total: number;
}

export interface LocalSyncOutboxStore {
  enqueue(record: LocalOutboxRecord): Promise<void>;
  pending(limit?: number): Promise<LocalOutboxRecord[]>;
  countUnsynced(tenantId?: string): Promise<UnsyncedCount>;
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

export interface RemoteAttendanceWrite {
  attendance: Attendance;
  version: number;
  deleted: boolean;
}

export interface LocalAttendanceStore extends LocalStore<Attendance> {
  /** Writes a server-confirmed row locally without queueing it for push. */
  applyRemote(write: RemoteAttendanceWrite): Promise<void>;
}

export interface LocalDatabase {
  outbox: LocalSyncOutboxStore;
}

export { createWatermelonDatabase } from './watermelon';
