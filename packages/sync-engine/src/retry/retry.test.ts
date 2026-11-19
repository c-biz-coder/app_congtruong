import { describe, expect, it } from 'vitest';
import { delayForAttempt, shouldRetry, DEFAULT_RETRY_POLICY } from './retry';

describe('retry policy', () => {
  it('grows backoff exponentially and caps at maxDelayMs', () => {
    expect(delayForAttempt(1, DEFAULT_RETRY_POLICY)).toBe(1000);
    expect(delayForAttempt(2, DEFAULT_RETRY_POLICY)).toBe(2000);
    expect(delayForAttempt(7, DEFAULT_RETRY_POLICY)).toBe(60_000);
  });

  it('stops after max attempts', () => {
    expect(shouldRetry(1, DEFAULT_RETRY_POLICY)).toBe(true);
    expect(shouldRetry(5, DEFAULT_RETRY_POLICY)).toBe(false);
  });

  it('does not retry permanent failures', () => {
    expect(shouldRetry(1, DEFAULT_RETRY_POLICY, { permanent: true })).toBe(false);
  });
});
