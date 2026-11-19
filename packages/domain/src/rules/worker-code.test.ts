import { describe, expect, it } from 'vitest';
import { isValidWorkerCode, requireValidWorkerCode } from './worker-code';
import { DomainError } from '../errors';

describe('worker-code rule', () => {
  it('accepts valid uppercase alphanumeric codes', () => {
    expect(isValidWorkerCode('VN1234')).toBe(true);
    expect(isValidWorkerCode('ABC')).toBe(true);
  });

  it('rejects lowercase, symbols and short codes', () => {
    expect(isValidWorkerCode('vn123')).toBe(false);
    expect(isValidWorkerCode('AB')).toBe(false);
    expect(isValidWorkerCode('A B C')).toBe(false);
  });

  it('throws a DomainError when a code is invalid', () => {
    expect(() => requireValidWorkerCode('bad!')).toThrow(DomainError);
  });

  it('returns the code when valid', () => {
    expect(requireValidWorkerCode('VN1234')).toBe('VN1234');
  });
});
