import type { ProjectStatus } from '../enums/project-status';

/** Domain entity: a construction site/project, always owned by an organization. */
export interface Project {
  id: string;
  organizationId: string;
  siteName: string;
  address: string;
  status: ProjectStatus;
}
