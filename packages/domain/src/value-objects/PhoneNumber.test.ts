import { describe, expect, it } from 'vitest';
import { InvalidPhoneNumberError, PhoneNumber } from './PhoneNumber';

describe('PhoneNumber value object', () => {
  it('accepts a valid Vietnamese mobile number', () => {
    expect(PhoneNumber.create('0912345678').toLocalFormat()).toBe('0912345678');
  });

  it('normalizes the +84 international prefix to local format', () => {
    expect(PhoneNumber.create('+84912345678').toLocalFormat()).toBe('0912345678');
  });

  it('rejects invalid numbers', () => {
    expect(() => PhoneNumber.create('1234')).toThrow(InvalidPhoneNumberError);
    expect(() => PhoneNumber.create('09999999999')).toThrow(InvalidPhoneNumberError);
  });
});
