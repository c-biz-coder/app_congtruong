import { describe, expect, it } from 'vitest';
import { createUuid, isUuid } from './id';

describe('id utilities', () => {
  it('creates a valid UUID', () => {
    expect(isUuid(createUuid())).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
