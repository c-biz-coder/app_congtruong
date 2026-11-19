export const PERMISSIONS = [
  'project.read',
  'project.write',
  'contractor.read',
  'contractor.write',
  'safety.create',
  'safety.approve',
  'incident.create',
  'incident.approve',
  'report.export',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
