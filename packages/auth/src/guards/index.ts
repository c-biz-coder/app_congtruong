import type { Permission } from '../permissions';
import { roleHasPermission } from '../policies';
import type { UserRole } from '../roles';

export class AuthorizationError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = 'AuthorizationError';
    this.permission = permission;
  }
}

/** Throws when the user's role does not grant the requested permission. */
export function assertPermission(role: UserRole | undefined, permission: Permission): void {
  if (role === undefined || !roleHasPermission(role, permission)) {
    throw new AuthorizationError(permission);
  }
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  return role !== undefined && roleHasPermission(role, permission);
}
