import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class WorkerModel extends Model {
  static table = 'workers';

  @field('tenant_id') tenantId!: string;
  @field('project_id') projectId!: string | null;
  @field('code') code!: string;
  @field('full_name') fullName!: string;
  @field('phone_number') phoneNumber!: string;
  @field('status') status!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('version') version!: number;
  @field('sync_status') syncState!: string;
  @field('deleted_at') deletedAt!: number | null;
}