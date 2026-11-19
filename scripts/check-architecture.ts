/**
 * Architecture Guard (contract section 26).
 *
 * Scans the workspace for dependency violations and aborts with a non-zero
 * exit code when the architecture contract is broken.
 *
 * Enforced rules:
 *  1. packages/domain must not import framework or infrastructure (react,
 *     react-native, expo, zustand, @supabase, @nozbe, @partner-os/database,
 *     @partner-os/sync-engine).
 *  2. A package must never import from an app.
 *  3. apps/web must not import mobile-only stacks (react-native, expo, @nozbe)
 *     or apps/mobile.
 *  4. apps/mobile must not import web-only stacks (react-dom, @vitejs, next)
 *     or apps/web.
 *  5. No deep imports into a package internals (`@partner-os/<pkg>/...`).
 *  6. No relative import may cross the owning package/app boundary.
 *  7. No circular dependency between workspace packages/apps.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const WORKSPACE_ROOT = resolve(import.meta.dirname, '..');

const INTERNAL_PACKAGES = [
  'domain',
  'contracts',
  'auth',
  'sync-engine',
  'database',
  'shared-utils',
  'i18n',
  'ui',
] as const;

const FRAMEWORK_INFRA = [
  'react',
  'react-native',
  'expo',
  'zustand',
  '@supabase',
  '@nozbe',
  '@vitejs',
  'next',
  'react-dom',
];

const MOBILE_ONLY = ['react-native', 'expo', '@nozbe'];
const WEB_ONLY = ['react-dom', '@vitejs', 'next'];

interface Violation {
  file: string;
  rule: string;
  detail: string;
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (skipPath(full)) {
      continue;
    }
    if (statSync(full).isDirectory()) {
      walkFiles(full, acc);
    } else if (extname(full) === '.ts' || extname(full) === '.tsx') {
      acc.push(full);
    }
  }
  return acc;
}

function skipPath(path: string): boolean {
  const rel = relative(WORKSPACE_ROOT, path);
  const segments = rel.split(sep);
  const ignoredParts = [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.turbo',
    '.expo',
    '.git',
    'coverage',
    'generated',
    '.temp',
  ];
  if (segments.some((part) => ignoredParts.includes(part))) {
    return true;
  }
  if (segments[0] === '.github' || segments[0] === 'scripts') {
    return true;
  }
  return false;
}

function owningPackage(file: string): string | null {
  const rel = relative(WORKSPACE_ROOT, file).split(sep);
  if ((rel[0] === 'apps' || rel[0] === 'packages') && rel[1]) {
    return `${rel[0]}/${rel[1]}`;
  }
  return null;
}

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /from\s*['"]([^'"]+)['"]/g,
    /import\s*['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\)/g,
    /require\(\s*['"]([^'"]+)['"]\)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function isPackageSpecifier(spec: string): boolean {
  return spec.startsWith('@partner-os/');
}

function specPackageName(spec: string): string | null {
  const name = spec.split('/')[1];
  return INTERNAL_PACKAGES.includes(name as (typeof INTERNAL_PACKAGES)[number]) ? name : null;
}

function specIsFrameworkInfra(spec: string): boolean {
  return FRAMEWORK_INFRA.some((name) => spec === name || spec.startsWith(`${name}/`));
}

function check(pkg: string, file: string, violations: Violation[]): void {
  const source = readFileSync(file, 'utf8');
  const importSpecifiers = extractImportSpecifiers(source);

  for (const spec of importSpecifiers) {
    if (spec.startsWith('.')) {
      const target = resolve(sep === '/' ? file : file.replaceAll('/', sep), '..', spec);
      const targetPkg = owningPackage(target);
      if (targetPkg !== null && targetPkg !== pkg) {
        violations.push({
          file: relative(WORKSPACE_ROOT, file),
          rule: 'cross-boundary relative import',
          detail: `${spec} (${pkg}) reaches into ${targetPkg ?? 'unknown'}`,
        });
      }
      continue;
    }

    if (isPackageSpecifier(spec)) {
      if (pkg !== null && pkg.split('/')[0] === 'packages' && spec.startsWith('@partner-os/')) {
        const targetName = spec.split('/')[1];
        if (targetName === 'web' || targetName === 'mobile') {
          violations.push({
            file: relative(WORKSPACE_ROOT, file),
            rule: 'package imports app',
            detail: `"${spec}" imported from ${pkg}`,
          });
        }
        const internal = specPackageName(spec);
        if (internal && spec !== `@partner-os/${internal}`) {
          violations.push({
            file: relative(WORKSPACE_ROOT, file),
            rule: 'deep package import',
            detail: `Use the package entry point @partner-os/${internal} instead of "${spec}"`,
          });
        }
      }
    }

    if (pkg === 'packages/domain') {
      if (specIsFrameworkInfra(spec)) {
        violations.push({
          file: relative(WORKSPACE_ROOT, file),
          rule: 'domain imports framework/infrastructure',
          detail: `"${spec}"`,
        });
      }
    }

    if (pkg === 'apps/web') {
      const hits = MOBILE_ONLY.filter((n) => spec === n || spec.startsWith(`${n}/`));
      if (hits.length > 0 || spec.startsWith('@partner-os/mobile')) {
        violations.push({
          file: relative(WORKSPACE_ROOT, file),
          rule: 'web imports mobile stack',
          detail: `"${spec}"`,
        });
      }
    }

    if (pkg === 'apps/mobile') {
      const hits = WEB_ONLY.filter((n) => spec === n || spec.startsWith(`${n}/`));
      if (hits.length > 0 || spec.startsWith('@partner-os/web')) {
        violations.push({
          file: relative(WORKSPACE_ROOT, file),
          rule: 'mobile imports web stack',
          detail: `"${spec}"`,
        });
      }
    }
  }
}

function detectCycles(files: string[]): string[] {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();
  const fileOwner = new Map<string, string>();

  for (const file of files) {
    const owner = owningPackage(file);
    if (!owner) {
      continue;
    }
    nodes.add(owner);
    fileOwner.set(file, owner);
  }

  for (const file of files) {
    const owner = fileOwner.get(file);
    if (!owner) {
      continue;
    }
    const source = readFileSync(file, 'utf8');
    const targets = edges.get(owner) ?? new Set<string>();
    for (const spec of extractImportSpecifiers(source)) {
      if (spec.startsWith('@partner-os/')) {
        const targetName = spec.split('/')[1];
        const targetOwner =
          targetName === 'web' || targetName === 'mobile'
            ? `apps/${targetName}`
            : specPackageName(spec)
              ? `packages/${specPackageName(spec)}`
              : null;
        if (targetOwner && targetOwner !== owner) {
          targets.add(targetOwner);
        }
      }
    }
    if (targets.size > 0) {
      edges.set(owner, targets);
    }
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];
  const cycles: string[] = [];

  function visit(node: string): boolean {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of edges.get(node) ?? []) {
      const nextColor = color.get(next) ?? WHITE;
      if (nextColor === GRAY) {
        const from = stack.indexOf(next);
        cycles.push([...stack.slice(from), next].join(' -> '));
        return true;
      }
      if (nextColor === WHITE && visit(next)) {
        return true;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return false;
  }

  for (const node of nodes) {
    if ((color.get(node) ?? WHITE) === WHITE) {
      visit(node);
    }
  }
  return cycles;
}

function main(): void {
  const files = walkFiles(WORKSPACE_ROOT);
  const violations: Violation[] = [];

  for (const file of files) {
    const pkg = owningPackage(file);
    if (pkg && pkg.startsWith('packages/')) {
      check(pkg, file, violations);
    }
    if (pkg === 'apps/web' || pkg === 'apps/mobile') {
      check(pkg, file, violations);
    }
  }

  const cycles = detectCycles(files);

  if (violations.length === 0 && cycles.length === 0) {
    console.log('✅ Architecture Guard: PASS');
    return;
  }

  console.error(
    `❌ Architecture Guard: FAIL (${violations.length} violations, ${cycles.length} cycles)`,
  );
  for (const violation of violations) {
    console.error(`  - ${violation.file}: ${violation.rule} (${violation.detail})`);
  }
  for (const cycle of cycles) {
    console.error(`  - cycle: ${cycle}`);
  }
  process.exit(1);
}

main();
