/**
 * Immutable value object for a Vietnamese mobile phone number.
 * Keeps phone normalization as a single source of truth.
 */
const VIETNAM_MOBILE_PATTERN = /^(?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}$/;

export class InvalidPhoneNumberError extends Error {
  constructor(input: string) {
    super(`Invalid phone number: "${input}"`);
    this.name = 'InvalidPhoneNumberError';
  }
}

export class PhoneNumber {
  private readonly normalized: string;

  private constructor(value: string) {
    this.normalized = value;
  }

  static create(input: string): PhoneNumber {
    const trimmed = input.trim();
    if (!VIETNAM_MOBILE_PATTERN.test(trimmed)) {
      throw new InvalidPhoneNumberError(input);
    }
    return new PhoneNumber(trimmed);
  }

  /** Normalize to the local 10-digit format used for storage/search. */
  toLocalFormat(): string {
    if (this.normalized.startsWith('+84')) {
      return `0${this.normalized.slice(3)}`;
    }
    if (this.normalized.startsWith('84')) {
      return `0${this.normalized.slice(2)}`;
    }
    return this.normalized;
  }

  toString(): string {
    return this.normalized;
  }
}
