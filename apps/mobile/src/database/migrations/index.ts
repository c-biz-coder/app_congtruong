import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const mobileMigrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'sync_outbox',
          columns: [{ name: 'device_id', type: 'string', isIndexed: true }],
        }),
      ],
    },
  ],
});