export const SYNC_ACTIONS = ['push', 'pull', 'retry', 'conflict', 'commit', 'apply'] as const;

export type SyncAction = (typeof SYNC_ACTIONS)[number];

export interface SyncAuditEntry {
  auditId: string;
  operationId: string;
  recordType: string;
  recordId: string;
  action: SyncAction;
  happenedAt: string;
  detail: string;
}

export function createUuid(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function createAuditEntry(
  input: Omit<SyncAuditEntry, 'auditId' | 'happenedAt'>,
  happenedAt = new Date().toISOString(),
): SyncAuditEntry {
  return { ...input, auditId: createUuid(), happenedAt };
}
