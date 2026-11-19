import { Database, Q } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { Collection } from '@nozbe/watermelondb';
import type { Worker } from '@partner-os/domain';
import type { LocalOutboxRecord, LocalWorkerStore } from './index';
import { mobileSchema } from './schema';
import { mobileMigrations } from './migrations';
import { SyncOutboxModel } from './models/SyncOutboxModel';
import { WorkerModel } from './models/WorkerModel';

function toWorker(model: WorkerModel): Worker {
  return {
    id: model.id,
    tenantId: model.tenantId,
    projectId: model.projectId,
    code: model.code,
    fullName: model.fullName,
    phoneNumber: model.phoneNumber,
    status: model.status as Worker['status'],
  };
}

function assignWorker(model: WorkerModel, worker: Worker): void {
  model.tenantId = worker.tenantId;
  model.projectId = worker.projectId;
  model.code = worker.code;
  model.fullName = worker.fullName;
  model.phoneNumber = worker.phoneNumber;
  model.status = worker.status;
  model.updatedAt = Date.now();
  model.version = model.version || 1;
  model.syncState = 'pending';
  model.deletedAt = null;
}

function createWorkerStore(database: Database): LocalWorkerStore {
  const collection = database.collections.get<WorkerModel>('workers');

  async function findModel(id: string): Promise<WorkerModel | null> {
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  }

  return {
    async list() {
      return (await collection.query().fetch()).map(toWorker);
    },
    async findById(id) {
      const model = await findModel(id);
      return model ? toWorker(model) : null;
    },
    async versionOf(id) {
      const model = await findModel(id);
      return model ? model.version || 1 : null;
    },
    async insert(worker) {
      await database.write(async () => {
        await collection.create((model) => {
          model._raw.id = worker.id;
          model.createdAt = Date.now();
          assignWorker(model, worker);
        });
      });
    },
    async update(id, patch) {
      return database.write(async () => {
        const model = await collection.find(id);
        await model.update((current) => {
          assignWorker(current, { ...toWorker(current), ...patch });
          current.version = (current.version || 1) + 1;
        });
        return toWorker(model);
      });
    },
    async remove(id) {
      await database.write(async () => {
        const model = await collection.find(id);
        await model.markAsDeleted();
      });
    },
    async applyRemote({ worker, version, deleted }) {
      await database.write(async () => {
        const model = await findModel(worker.id);
        if (deleted) {
          if (model) await model.destroyPermanently();
          return;
        }
        if (model) {
          await model.update((current) => {
            assignWorker(current, worker);
            current.version = version;
            current.syncState = 'synced';
          });
          return;
        }
        await collection.create((created) => {
          created._raw.id = worker.id;
          created.createdAt = Date.now();
          assignWorker(created, worker);
          created.version = version;
          created.syncState = 'synced';
        });
      });
    },
  };
}


function createOutboxStore(database: Database) {
  const collection = database.collections.get<SyncOutboxModel>('sync_outbox');

  const toRecord = (model: SyncOutboxModel): LocalOutboxRecord => ({
    operationId: model.operationId,
    deviceId: model.deviceId,
    recordType: model.recordType,
    recordId: model.recordId,
    operation: model.operation as LocalOutboxRecord['operation'],
    payload: model.payload,
    version: model.version,
    retryCount: model.retryCount,
    lastError: model.lastError,
    status: model.status as LocalOutboxRecord['status'],
    createdAt: model.createdAt,
  });

  return {
    async enqueue(record: LocalOutboxRecord) {
      await database.write(async () => {
        await collection.create((model) => {
          model.deviceId = record.deviceId;
          model.operationId = record.operationId;
          model.recordType = record.recordType;
          model.recordId = record.recordId;
          model.operation = record.operation;
          model.payload = record.payload;
          model.version = record.version;
          model.retryCount = record.retryCount;
          model.lastError = record.lastError;
          model.status = record.status;
          model.createdAt = record.createdAt;
        });
      });
    },
    async pending(limit = 50) {
      const records = await collection
        .query(Q.where('status', 'pending'), Q.sortBy('created_at', Q.asc), Q.take(limit))
        .fetch();
      return records.map(toRecord);
    },
    async markCommitted(operationId: string) {
      await updateOutbox(database, collection, operationId, (model) => {
        model.status = 'committed';
      });
    },
    // Failed records stay 'pending' so the next flush retries them; the sync engine caps attempts.
    async markFailed(operationId: string, error: string) {
      await updateOutbox(database, collection, operationId, (model) => {
        model.retryCount += 1;
        model.lastError = error;
      });
    },
  };
}

async function updateOutbox(
  database: Database,
  collection: Collection<SyncOutboxModel>,
  operationId: string,
  update: (model: SyncOutboxModel) => void,
): Promise<void> {
  await database.write(async () => {
    const model = await collection.query(Q.where('operation_id', operationId)).fetch();
    const record = model[0] as SyncOutboxModel | undefined;
    if (record) {
      await record.update(update);
    }
  });
}

export function createWatermelonDatabase(databaseName = 'partner-os'): {
  workers: LocalWorkerStore;
  outbox: ReturnType<typeof createOutboxStore>;
} {
  const adapter = new SQLiteAdapter({
    schema: mobileSchema,
    migrations: mobileMigrations,
    dbName: databaseName,
  });
  const database = new Database({
    adapter,
    modelClasses: [WorkerModel, SyncOutboxModel],
  });
  return { workers: createWorkerStore(database), outbox: createOutboxStore(database) };
}