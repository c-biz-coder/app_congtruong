import type { UserRole } from '../roles';

/** A user's membership in one organization, with its assigned role. */
export interface SessionMemberContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

/** The full authenticated session, including the currently selected tenant. */
export interface SessionContext {
  userId: string;
  sessionId: string;
  memberships: SessionMemberContext[];
  currentOrganizationId: string | null;
  currentProjectId: string | null;
}

export interface AuthorizationContext {
  session: SessionContext | null;
}
