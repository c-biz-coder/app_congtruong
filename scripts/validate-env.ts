/**
 * Environment validator (contract sections 33).
 * Ensures every placeholder key declared in .env.example is provided in a
 * local .env/.env.local before apps are allowed to run.
 *
 * Usage:
 *   pnpm validate:env                # warning-only, exit 0
 *   pnpm validate:env --strict       # exit 1 when keys are missing
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const STRICT = process.argv.includes('--strict');

function readEnvFile(file: string): Map<string, string> {
  const values = new Map<string, string>();
  if (!existsSync(file)) {
    return values;
  }
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    if (match) {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

function requiredKeysFromExample(): string[] {
  const example = join(ROOT, '.env.example');
  if (!existsSync(example)) {
    return [];
  }
  const keys: string[] = [];
  for (const line of readFileSync(example, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line.trim());
    if (match) {
      keys.push(match[1]);
    }
  }
  return keys;
}

function main(): void {
  const keys = requiredKeysFromExample();
  if (keys.length === 0) {
    console.log('✅ Env check: no .env.example keys to validate (PASS)');
    return;
  }

  const local = readEnvFile(join(ROOT, '.env.local'));
  const base = readEnvFile(join(ROOT, '.env'));
  const merged = new Map([...base, ...local]);

  const missing = keys.filter((key) => {
    const value = merged.get(key);
    return value === undefined || value.trim() === '' || value.includes('YOUR_');
  });

  if (missing.length === 0) {
    console.log('✅ Env check: PASS');
    return;
  }

  if (STRICT) {
    console.error('❌ Env check: FAIL (missing or placeholder values)');
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    process.exit(1);
  }

  console.warn(
    `⚠️  Env check: ${missing.length} placeholder keys not configured (run with --strict to fail)`,
  );
  for (const key of missing) {
    console.warn(`  - ${key}`);
  }
}

main();
