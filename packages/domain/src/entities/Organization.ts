import type { OrganizationStatus } from '../enums/organization-status';

/** Domain entity: a tenant organization. Root of the multi-tenant boundary. */
export interface Organization {
  id: string;
  name: string;
  code: string;
  status: OrganizationStatus;
}
