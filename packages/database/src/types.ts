/**
 * Carrier types used by the repository/type layer.
 * Generated Supabase types are written here by `pnpm db:generate-types`.
 */
export interface SyncColumns {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface TenantOwned {
  tenantId: string;
}

export interface OrganizationOwned {
  organizationId: string;
}
