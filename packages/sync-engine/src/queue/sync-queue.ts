export interface SyncQueueItem {
  operationId: string;
  recordType: string;
  recordId: string;
  enqueuedAt: string;
  priority: number;
}

/**
 * Sorts queue items by priority (ascending) then enqueued time so the engine
 * processes the highest-priority, oldest change first.
 */
export function sortQueue(items: readonly SyncQueueItem[]): SyncQueueItem[] {
  return [...items].sort(
    (a, b) => a.priority - b.priority || a.enqueuedAt.localeCompare(b.enqueuedAt),
  );
}
