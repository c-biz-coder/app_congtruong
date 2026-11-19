import type { CreateWorkerInput, Worker, WorkerApi } from '@partner-os/contracts';
import { supabaseClient } from '../../../shared/supabase/client';

function toSnake(input: CreateWorkerInput): Record<string, unknown> {
  return {
    tenant_id: input.tenantId,
    project_id: input.projectId ?? null,
    code: input.code,
    full_name: input.fullName,
    phone_number: input.phoneNumber,
    status: input.status ?? 'ACTIVE',
  };
}

function toCamel(row: unknown): Worker {
  const source = (row ?? {}) as Record<string, unknown>;
  return {
    id: String(source.id),
    tenantId: String(source.tenant_id),
    projectId: source.project_id === null ? null : String(source.project_id),
    code: String(source.code),
    fullName: String(source.full_name),
    phoneNumber: String(source.phone_number),
    status: String(source.status) as Worker['status'],
  };
}

export function createSupabaseWorkerApi(): WorkerApi {
  const client = supabaseClient();

  return {
    async list(query) {
      let builder = client.from('workers').select('*');
      if (query.projectId !== undefined) {
        builder = builder.eq('project_id', query.projectId);
      }
      if (query.status !== undefined) {
        builder = builder.eq('status', query.status);
      }
      const { data, error } = await builder;
      if (error) {
        throw new Error(`Failed to list workers: ${error.message}`);
      }
      const rows = data as unknown as Array<Record<string, unknown>> | null;
      return (rows ?? []).map(toCamel);
    },

    async findById(id) {
      const { data, error } = await client.from('workers').select('*').eq('id', id).maybeSingle();
      if (error) {
        throw new Error(`Failed to find worker: ${error.message}`);
      }
      return data === null ? null : toCamel(data);
    },

    async create(input) {
      const { data, error } = await client.from('workers').insert(toSnake(input)).select().single();
      if (error) {
        throw new Error(`Failed to create worker: ${error.message}`);
      }
      return toCamel(data);
    },

    async update(id, patch) {
      const columns: Record<string, unknown> = {};
      if (patch.fullName !== undefined) columns['full_name'] = patch.fullName;
      if (patch.phoneNumber !== undefined) columns['phone_number'] = patch.phoneNumber;
      if (patch.status !== undefined) columns['status'] = patch.status;
      if (patch.projectId !== undefined) columns['project_id'] = patch.projectId;
      const { data, error } = await client
        .from('workers')
        .update(columns)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        throw new Error(`Failed to update worker: ${error.message}`);
      }
      return toCamel(data);
    },

    async remove(id) {
      // Soft delete keeps the tenant audit trail.
      const { error } = await client
        .from('workers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        throw new Error(`Failed to remove worker: ${error.message}`);
      }
      return { id, deletedAt: new Date().toISOString() };
    },
  };
}
