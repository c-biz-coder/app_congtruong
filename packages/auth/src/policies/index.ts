import type { Permission } from '../permissions';
import type { UserRole } from '../roles';

/**
 * Role -> permission matrix.
 * This is the application-authorization layer; it never replaces PostgreSQL RLS.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SYS_ADMIN: [
    'project.read',
    'project.write',
    'contractor.read',
    'contractor.write',
    'safety.create',
    'safety.approve',
    'incident.create',
    'incident.approve',
    'report.export',
  ],
  PROJECT_VIEWER: ['project.read', 'contractor.read', 'report.export'],
  SITE_MANAGER: [
    'project.read',
    'project.write',
    'contractor.read',
    'contractor.write',
    'safety.create',
    'safety.approve',
    'incident.create',
    'incident.approve',
    'report.export',
  ],
  SUB_CONTRACTOR: ['contractor.read', 'contractor.write', 'safety.create', 'incident.create'],
  WORKER: ['incident.create'],
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
