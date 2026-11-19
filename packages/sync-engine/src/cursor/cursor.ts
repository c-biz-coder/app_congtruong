/**
 * A monotonic server-side cursor. In this scaffold it is the server timestamp
 * watermark of the last successfully applied Pull response.
 */
export type SyncCursor = string;

export function advanceCursor(current: SyncCursor | null, serverTimestamp: string): SyncCursor {
  if (current === null) {
    return serverTimestamp;
  }
  return serverTimestamp > current ? serverTimestamp : current;
}
