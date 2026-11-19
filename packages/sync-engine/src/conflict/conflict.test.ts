import { describe, expect, it } from 'vitest';
import { strategyForRecordType } from './conflict';

describe('conflict strategy resolution', () => {
  it('uses VERSION_CHECK for incidents and inspections', () => {
    expect(strategyForRecordType('incident', 'LWW')).toBe('VERSION_CHECK');
    expect(strategyForRecordType('inspection', 'LWW')).toBe('VERSION_CHECK');
  });

  it('uses SERVER_WINS for approvals', () => {
    expect(strategyForRecordType('approval', 'LWW')).toBe('SERVER_WINS');
  });

  it('falls back to the provided default for unknown records', () => {
    expect(strategyForRecordType('daily_log', 'LWW')).toBe('LWW');
  });
});
