import { DomainError } from '../errors';

const WORKER_CODE_PATTERN = /^[A-Z0-9]{3,20}$/;

export function isValidWorkerCode(code: string): boolean {
  return WORKER_CODE_PATTERN.test(code);
}

export function requireValidWorkerCode(code: string): string {
  if (!isValidWorkerCode(code)) {
    throw new DomainError('INVALID_WORKER_CODE', `Invalid worker code "${code}"`, { code });
  }
  return code;
}
