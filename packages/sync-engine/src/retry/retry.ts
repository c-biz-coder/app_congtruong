export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60_000,
};

/** Exponential backoff with a capped maximum delay. Attempt starts at 1. */
export function delayForAttempt(attempt: number, policy: RetryPolicy): number {
  const attemptIndex = Math.max(1, attempt) - 1;
  const raw = policy.baseDelayMs * 2 ** attemptIndex;
  return Math.min(raw, policy.maxDelayMs);
}

export function shouldRetry(
  attempt: number,
  policy: RetryPolicy,
  error?: { permanent?: boolean },
): boolean {
  if (error?.permanent) {
    return false;
  }
  return attempt < policy.maxAttempts;
}
