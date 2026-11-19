import { useEffect, useState, useSyncExternalStore } from 'react';
import { translate } from '@partner-os/i18n';
import { createSupabaseWorkerApi } from '../api/supabaseWorkerApi';
import { createWorkersStore } from '../store/workersStore';

function workerRow(worker: {
  code: string;
  fullName: string;
  status: string;
  phoneNumber: string;
}): React.JSX.Element {
  return (
    <li key={worker.code}>
      <span className="font-medium">{worker.fullName}</span>
      <span className="ml-2 text-neutral-500">({worker.code})</span>
      <span className={`ml-2 ${worker.status === 'ACTIVE' ? 'text-success' : 'text-warning'}`}>
        {worker.status}
      </span>
      <span className="ml-2 text-neutral-400">{worker.phoneNumber}</span>
    </li>
  );
}

export function WorkersListPage({ tenantId }: { tenantId: string }): React.JSX.Element {
  const [store] = useState(createWorkersStore);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    void store.load(createSupabaseWorkerApi(), { tenantId });
  }, [store, tenantId]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-bold">{translate('vi', 'nav.workers')}</h1>

      {state.status === 'loading' && <p className="mt-4">{translate('vi', 'common.loading')}</p>}

      {state.status === 'error' && (
        <p className="mt-4 text-warning" role="alert">
          {state.error ?? translate('vi', 'common.error')}
        </p>
      )}

      {state.status === 'loaded' && state.workers.length === 0 && (
        <p className="mt-4 text-neutral-500">{translate('vi', 'common.empty')}</p>
      )}

      {state.status === 'loaded' && state.workers.length > 0 && (
        <ul className="mt-4 space-y-2">{state.workers.map(workerRow)}</ul>
      )}
    </main>
  );
}
