export const OPERATION_TYPES = ['create', 'update', 'delete'] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];
