import { isUserRole, type UserRole } from '../roles';

export interface AuthenticatedMember {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Refuse ambiguous memberships or token claims instead of selecting a tenant.
 * The database remains responsible for authorization.
 */
export function resolveMembership(
  userId: string,
  memberships: readonly { user_id: string; tenant_id: string; role: string }[],
  claims: { sub?: unknown; tenant_id?: unknown; app_role?: unknown },
): AuthenticatedMember {
  if (memberships.length !== 1) {
    throw new Error('Tài khoản phải được cấp quyền vào đúng một đơn vị.');
  }
  const member = memberships[0]!;
  if (
    member.user_id !== userId ||
    claims.sub !== userId ||
    claims.tenant_id !== member.tenant_id ||
    claims.app_role !== member.role ||
    !isUserRole(member.role)
  ) {
    throw new Error('Quyền tài khoản không hợp lệ hoặc đã thay đổi. Vui lòng liên hệ quản trị viên.');
  }
  return { userId, tenantId: member.tenant_id, role: member.role };
}
