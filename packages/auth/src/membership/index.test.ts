import { describe, expect, it } from 'vitest';
import { resolveMembership } from './index';

const member = { user_id: 'user', tenant_id: 'tenant', role: 'SITE_MANAGER' };
const claims = { sub: 'user', tenant_id: 'tenant', app_role: 'SITE_MANAGER' };

describe('resolveMembership', () => {
  it('accepts a single membership matching authenticated token claims', () => {
    expect(resolveMembership('user', [member], claims)).toEqual({
      userId: 'user',
      tenantId: 'tenant',
      role: 'SITE_MANAGER',
    });
  });

  it('rejects absent or ambiguous memberships', () => {
    expect(() => resolveMembership('user', [], claims)).toThrow();
    expect(() => resolveMembership('user', [member, member], claims)).toThrow();
  });

  it('rejects stale tenant or role claims and unknown roles', () => {
    expect(() => resolveMembership('user', [member], { ...claims, tenant_id: 'other' })).toThrow();
    expect(() => resolveMembership('user', [member], { ...claims, app_role: 'WORKER' })).toThrow();
    expect(() =>
      resolveMembership('user', [{ ...member, role: 'UNKNOWN' }], {
        ...claims,
        app_role: 'UNKNOWN',
      }),
    ).toThrow();
  });
});
