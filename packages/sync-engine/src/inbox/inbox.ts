export interface InboxRecord {
  messageId: string;
  recordType: string;
  recordId: string;
  payload: unknown;
  serverTimestamp: string;
  syncCursor: string;
  appliedAt: string | null;
}

export function markInboxApplied(
  record: InboxRecord,
  appliedAt = new Date().toISOString(),
): InboxRecord {
  return { ...record, appliedAt };
}
