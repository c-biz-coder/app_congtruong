import type { SupabaseClient } from '@supabase/supabase-js';
import { WorkerSchema } from '@partner-os/contracts';
import type {
  OutboxRecord,
  PullBatch,
  PullRequest,
  PushResult,
  SyncTransport,
} from '@partner-os/sync-engine';

const WORKER_RECORD_TYPE = 'worker';
const EPOCH = '1970-01-01T00:00:00.000Z';

interface WorkerRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  code: string;
  full_name: string;
  phone_number: string;
  status: string;
  version: number;
  updated_at: string;
  deleted_at: string | null;
}

type WorkerDto = ReturnType<typeof WorkerSchema.parse>;

function toRow(worker: WorkerDto, version: number) {
  return {
    id: worker.id,
    tenant_id: worker.tenantId,
    project_id: worker.projectId ?? null,
    code: worker.code,
    full_name: worker.fullName,
    phone_number: worker.phoneNumber,
    status: worker.status,
    version,
  };
}

function toPayload(row: WorkerRow) {
  return {
    worker: {
      id: row.id,
      tenantId: row.tenant_id,
      projectId: row.project_id,
      code: row.code,
      fullName: row.full_name,
      phoneNumber: row.phone_number,
      status: row.status,
    },
    deleted: row.deleted_at !== null,
  };
}

/**
 * Supabase implementation of the sync transport. Tenant isolation comes from
 * RLS on public.workers; this adapter never filters by tenant itself.
 * An update is acknowledged only when the server still holds version-1; otherwise
 * it is reported as not acknowledged so stale offline writes never overwrite newer rows.
 */
export function createSupabaseSyncTransport(client: SupabaseClient): SyncTransport {
  async function pushWorker(record: OutboxRecord<unknown>): Promise<PushResult> {
    const worker = WorkerSchema.parse(record.payload);

    if (record.operation === 'create') {
      const { data, error } = await client
        .from('workers')
        .insert(toRow(worker, record.version))
        .select('version')
        .maybeSingle();
      if (error?.code === '23505') {
        return { acknowledged: false, serverVersion: record.version };
      }
      if (error) throw error;
      return { acknowledged: Boolean(data), serverVersion: data?.version ?? record.version };
    }

    const patch =
      record.operation === 'delete'
        ? { deleted_at: record.clientTimestamp, version: record.version }
        : toRow(worker, record.version);
    const { data, error } = await client
      .from('workers')
      .update(patch)
      .eq('id', worker.id)
      .eq('version', record.version - 1)
      .select('version')
      .maybeSingle();
    if (error) throw error;
    return { acknowledged: Boolean(data), serverVersion: data?.version ?? record.version - 1 };
  }

  return {
    async push(_operationId, record) {
      if (record.recordType !== WORKER_RECORD_TYPE) {
        throw new Error(`Unsupported record type for Supabase push: ${record.recordType}`);
      }
      return pushWorker(record);
    },

    async pull(request: PullRequest): Promise<PullBatch> {
      const since = request.cursor ?? EPOCH;
      const { data, error } = await client
        .from('workers')
        .select('id, tenant_id, project_id, code, full_name, phone_number, status, version, updated_at, deleted_at')
        .gt('updated_at', since)
        .order('updated_at', { ascending: true })
        .limit(request.limit ?? 50);
      if (error) throw error;

      const rows = (data ?? []) as WorkerRow[];
      const last = rows.at(-1);
      return {
        cursor: last ? last.updated_at : since,
        records: rows.map((row) => ({
          recordId: row.id,
          payload: toPayload(row),
          version: row.version,
        })),
      };
    },
  };
}
