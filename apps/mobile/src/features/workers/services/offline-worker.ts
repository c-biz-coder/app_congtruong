import { CreateWorkerInput, type Worker } from '@partner-os/contracts';
import type { WorkerRepository } from '@partner-os/database';
import { validateWorkerRecord } from '@partner-os/domain';
import { createUuid } from '@partner-os/shared-utils';

/**
 * Offline create use-case: validate at the boundary, ensure core business
 * rules hold, then persist locally and queue the sync.
 */
export async function createWorkerOffline(
  repo: WorkerRepository,
  input: CreateWorkerInput,
): Promise<Worker> {
  const parsed = CreateWorkerInput.parse(input);
  const status = parsed.status ?? 'ACTIVE';
  const body = {
    tenantId: parsed.tenantId,
    projectId: parsed.projectId ?? null,
    code: parsed.code,
    fullName: parsed.fullName,
    phoneNumber: parsed.phoneNumber,
    status,
  };
  validateWorkerRecord({ id: createUuid(), ...body });
  return repo.create(body);
}
