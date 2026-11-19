/**
 * Reset the local Supabase database and re-apply migrations + seed.
 * Usage: pnpm database-reset
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const result = spawnSync('supabase', ['db', 'reset'], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (result.error) {
  console.error('❌ database-reset: supabase CLI not found or failed.');
  console.error('   Install it first: https://supabase.com/docs/guides/cli');
  process.exit(1);
}

process.exit(result.status ?? 0);
