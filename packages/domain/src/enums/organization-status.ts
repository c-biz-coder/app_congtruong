export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];
