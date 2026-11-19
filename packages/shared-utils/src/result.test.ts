import { describe, expect, it } from 'vitest';
import { isOk, ok, fail, unwrap, map } from './result';

describe('Result', () => {
  it('carries a success value', () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toBe(42);
  });

  it('carries an error', () => {
    const result = fail(new Error('boom'));
    expect(isOk(result)).toBe(false);
    expect(() => unwrap(result)).toThrow('boom');
  });

  it('maps over the success value only', () => {
    const doubled = map(ok(2), (v) => v * 2);
    expect(unwrap(doubled)).toBe(4);
  });
});
