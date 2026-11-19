/**
 * Dependency checker (contract section 5 & 25).
 * Verifies every internal `@partner-os/*` dependency declared in workspace
 * packages/apps actually exists and is not referencing itself or the root.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WORKSPACE_DIRS = ['apps', 'packages'] as const;

interface WorkspaceManifest {
  name: string;
  path: string;
  manifest: Record<string, unknown>;
}

function findWorkspaceManifests(): WorkspaceManifest[] {
  const manifests: WorkspaceManifest[] = [];
  for (const dir of WORKSPACE_DIRS) {
    const base = join(ROOT, dir);
    const entries = readdirSync(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const pkgJsonPath = join(base, entry.name, 'package.json');
      if (!statSync(pkgJsonPath).isFile()) {
        continue;
      }
      const manifest = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as Record<string, unknown>;
      manifests.push({
        name: String(manifest.name ?? ''),
        path: join(dir, entry.name),
        manifest,
      });
    }
  }
  return manifests;
}

function main(): void {
  const manifests = findWorkspaceManifests();
  const byName = new Map(manifests.map((m) => [m.name, m.path]));
  const problems: string[] = [];

  for (const { name, path, manifest } of manifests) {
    const dependencies = manifest.dependencies as Record<string, string> | undefined;
    for (const [depName] of Object.entries(dependencies ?? {})) {
      if (!depName.startsWith('@partner-os/')) {
        continue;
      }
      const targetPath = byName.get(depName);
      if (targetPath === undefined) {
        problems.push(`${path}: missing internal package "${depName}"`);
      } else if (depName === name) {
        problems.push(`${path}: package must not depend on itself`);
      }
    }
  }

  if (problems.length === 0) {
    console.log('✅ Dependency check: PASS');
    return;
  }
  console.error('❌ Dependency check: FAIL');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

main();
