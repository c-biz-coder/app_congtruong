import type { SupabaseClient } from '@supabase/supabase-js';
import { AttendanceSchema } from '@partner-os/contracts';
import type {
  OutboxRecord,
  PullBatch,
  PullRequest,
  PushResult,
  SyncTransport,
} from '@partner-os/sync-engine';

const ATTENDANCE_RECORD_TYPE = 'attendance';
const EPOCH = '1970-01-01T00:00:00.000Z';

interface AttendanceRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  worker_id: string;
  work_date: string;
  status: string;
  check_in_at: string | null;
  check_out_at: string | null;
  note: string | null;
  version: number;
  updated_at: string;
  deleted_at: string | null;
}

type AttendanceDto = ReturnType<typeof AttendanceSchema.parse>;

function toRow(attendance: AttendanceDto, version: number) {
  return {
    id: attendance.id,
    tenant_id: attendance.tenantId,
    project_id: attendance.projectId ?? null,
    worker_id: attendance.workerId,
    work_date: attendance.workDate,
    status: attendance.status,
    check_in_at: attendance.checkInAt,
    check_out_at: attendance.checkOutAt,
    note: attendance.note,
    version,
  };
}

function toPayload(row: AttendanceRow) {
  return {
    attendance: {
      id: row.id,
      tenantId: row.tenant_id,
      projectId: row.project_id,
      workerId: row.worker_id,
      workDate: row.work_date,
      status: row.status,
      checkInAt: row.check_in_at,
      checkOutAt: row.check_out_at,
      note: row.note,
    },
    deleted: row.deleted_at !== null,
  };
}

/**
 * Supabase implementation of the sync transport for attendance.
 * Tenant isolation comes from RLS on public.attendance; this adapter never
 * filters by tenant itself. An update is acknowledged only when the server
 * still holds version-1; otherwise it is reported as not acknowledged so
 * stale offline writes never overwrite newer rows.
 */
export function createSupabaseAttendanceTransport(client: SupabaseClient): SyncTransport {
  async function pushAttendance(record: OutboxRecord<unknown>): Promise<PushResult> {
    const attendance = AttendanceSchema.parse(record.payload);

    if (record.operation === 'create') {
      const { data, error } = await client
        .from('attendance')
        .insert(toRow(attendance, record.version))
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
        : toRow(attendance, record.version);
    const { data, error } = await client
      .from('attendance')
      .update(patch)
      .eq('id', attendance.id)
      .eq('version', record.version - 1)
      .select('version')
      .maybeSingle();
    if (error) throw error;
    return { acknowledged: Boolean(data), serverVersion: data?.version ?? record.version - 1 };
  }

  return {
    async push(_operationId, record) {
      if (record.recordType !== ATTENDANCE_RECORD_TYPE) {
        throw new Error(`Unsupported record type for Supabase attendance push: ${record.recordType}`);
      }
      return pushAttendance(record);
    },

    async pull(request: PullRequest): Promise<PullBatch> {
      const since = request.cursor ?? EPOCH;
      const { data, error } = await client
        .from('attendance')
        .select(
          'id, tenant_id, project_id, worker_id, work_date, status, check_in_at, check_out_at, note, version, updated_at, deleted_at',
        )
        .gt('updated_at', since)
        .order('updated_at', { ascending: true })
        .limit(request.limit ?? 50);
      if (error) throw error;

      const rows = (data ?? []) as AttendanceRow[];
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