/**
 * Repository abstraction (contract section 24).
 * UI never talks to Supabase/WatermelonDB directly; it goes through a feature,
 * an application service and a repository. Implementations live in the
 * app/infrastructure layer.
 */
export interface Repository<TRecord, TId extends string = string> {
  findById(id: TId): Promise<TRecord | null>;
  list(filter?: Record<string, unknown>): Promise<TRecord[]>;
  create(input: Omit<TRecord, 'id'>): Promise<TRecord>;
  update(id: TId, patch: Partial<TRecord>): Promise<TRecord>;
  remove(id: TId): Promise<void>;
}

/** A repository whose rows are always scoped by a tenant/project column. */
export interface ScopedRepository<
  TRecord,
  TId extends string = string,
  TScope extends string = string,
> extends Repository<TRecord, TId> {
  readonly scopeColumn: keyof TRecord;
  listForScope(scopeId: TScope): Promise<TRecord[]>;
}
