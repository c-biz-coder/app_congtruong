import { create } from 'zustand';
import type { Worker, WorkerApi, WorkerListQuery } from '@partner-os/contracts';
import { listWorkers } from '../services/worker-application';

export interface WorkersStore {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  workers: Worker[];
  error: string | null;
  load: (api: WorkerApi, query: WorkerListQuery) => Promise<void>;
}

export function createWorkersStore(): WorkersStore & {
  getSnapshot: () => WorkersStore;
  subscribe: (listener: () => void) => () => void;
} {
  const internal = create<WorkersStore>()((set) => ({
    status: 'idle',
    workers: [],
    error: null,
    async load(api, query) {
      set({ status: 'loading', error: null });
      try {
        const workers = await listWorkers(api, query);
        set({ status: 'loaded', workers });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ status: 'error', workers: [], error: message });
      }
    },
  }));

  return {
    get status() {
      return internal.getState().status;
    },
    get workers() {
      return internal.getState().workers;
    },
    get error() {
      return internal.getState().error;
    },
    getSnapshot: internal.getState,
    subscribe: internal.subscribe,
    async load(api, query) {
      await internal.getState().load(api, query);
    },
  };
}
