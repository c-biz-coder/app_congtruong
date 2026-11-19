import {
  CreateWorkerInput,
  WorkerListQuery,
  type Worker,
  type WorkerApi,
} from '@partner-os/contracts';

/**
 * Application use-cases for the workers feature. Each input is validated
 * through the Zod boundary (contract section 7) before touching any adapter.
 */
export async function listWorkers(api: WorkerApi, query: WorkerListQuery): Promise<Worker[]> {
  const parsed = WorkerListQuery.parse(query);
  return api.list(parsed);
}

export async function createWorker(api: WorkerApi, input: CreateWorkerInput): Promise<Worker> {
  const parsed = CreateWorkerInput.parse(input);
  return api.create(parsed);
}
