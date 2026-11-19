import * as Network from 'expo-network';
import { useEffect } from 'react';

const isOnline = (state: Network.NetworkState): boolean =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

/**
 * Calls syncNow when the device goes from offline to online, and once when
 * the hook first sees a connection. Pass null while signed out to disable it.
 */
export function useAutoSync(syncNow: (() => Promise<void>) | null): void {
  useEffect(() => {
    if (!syncNow) return;
    const trigger = (): void => {
      syncNow().catch((error: unknown) => {
        console.warn('Sync failed', error);
      });
    };

    let wasOnline = false;
    void Network.getNetworkStateAsync().then((state) => {
      wasOnline = isOnline(state);
      if (wasOnline) trigger();
    });

    const subscription = Network.addNetworkStateListener((state) => {
      const online = isOnline(state);
      if (online && !wasOnline) trigger();
      wasOnline = online;
    });
    return () => {
      subscription.remove();
    };
  }, [syncNow]);
}
