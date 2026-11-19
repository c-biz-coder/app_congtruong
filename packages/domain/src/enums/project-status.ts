export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
