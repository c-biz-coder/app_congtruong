/**
 * Production-like build verification (contract section 38).
 * Runs the full workspace build and reports the outcome as a gate.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

console.log('🔨 verify-build: running pnpm build (all apps & packages)...');
const result = spawnSync('pnpm', ['build'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status === 0) {
  console.log('✅ verify-build: PASS');
  process.exit(0);
}
console.error('❌ verify-build: FAIL');
process.exit(result.status ?? 1);
