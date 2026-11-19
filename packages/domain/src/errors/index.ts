export class DomainError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.context = context;
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super('ENTITY_NOT_FOUND', `${entityName} not found: ${id}`, { entityName, id });
    this.name = 'EntityNotFoundError';
  }
}

export class InvalidStateError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('INVALID_STATE', message, context);
    this.name = 'InvalidStateError';
  }
}
