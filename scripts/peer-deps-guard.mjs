#!/usr/bin/env node
// Peer-dependency guard for the published libs.
//
// Walks the real module graph of every lib entry (public-api.ts and the
// relative imports it reaches) instead of grepping the folder, so specs,
// playground examples and doc comments cannot produce false positives, and
// checks the result against the lib's package.json:
//
//   undeclared    an external package is imported but is neither a peer nor a dependency
//   unused-peer   a peer is declared but no shipped file imports it
//   optional-in-primary   an optional peer is imported by the primary entry,
//                         which every consumer loads
//   tilde-peer    a peer range uses `~`, which blocks minors for no reason
//   range-drift   the same package carries different peer ranges across libs
//   stray-dependency   a runtime dependency other than the allowed set
//
// Usage: node scripts/peer-deps-guard.mjs

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const PUBLISHED_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];
export const ALLOWED_DEPENDENCIES = new Set(['tslib']);
const PLACEHOLDER = '0.0.0-PLACEHOLDER';

/**
 * Peers that are declared on purpose without a shipped import. Each entry
 * needs its reason: the guard otherwise flags a peer nothing imports.
 */
export const DECLARED_NOT_IMPORTED = {
  'common:@floating-ui/dom': 'consumer hands computePosition to the popover through a provider; the range documents the supported API',
  'interop:@tanstack/angular-query-experimental': 'the adapter types the query result structurally; the range documents the supported version',
};
const NODE_BUILTINS = new Set(builtinModules);

/** `@scope/pkg/deep` -> `@scope/pkg`, `rxjs/operators` -> `rxjs`; relative paths -> null. */
export function externalPackageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return null;
  }
  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const bare = name.replace(/^node:/, '');
  return NODE_BUILTINS.has(bare) ? null : name;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Directories under `libDir` that carry an ng-package.json: the primary entry plus secondary entries. */
export function findEntries(libDir, listDirs) {
  const entries = [];
  const visit = (dir) => {
    if (existsSync(join(dir, 'ng-package.json'))) {
      entries.push(dir);
    }
    for (const child of listDirs(dir)) {
      visit(child);
    }
  };
  visit(libDir);
  return entries;
}

/**
 * External packages reachable from one entry, mapped to the files importing
 * them. `readSource(file)` returns the text or null; `fileExists` resolves
 * relative imports. Both are injected so the walker is testable without disk.
 */
export function collectEntryImports(entryFile, readSource, fileExists) {
  const seen = new Set();
  const externals = new Map();
  const queue = [entryFile];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) {
      continue;
    }
    seen.add(file);
    const source = readSource(file);
    if (source === null) {
      continue;
    }
    for (const { fileName } of ts.preProcessFile(source, true, true).importedFiles) {
      const pkg = externalPackageName(fileName);
      if (pkg !== null) {
        const files = externals.get(pkg) ?? new Set();
        files.add(file);
        externals.set(pkg, files);
        continue;
      }
      const target = resolveRelative(dirname(file), fileName, fileExists);
      if (target !== null) {
        queue.push(target);
      }
    }
  }
  return externals;
}

function resolveRelative(fromDir, specifier, fileExists) {
  const base = resolve(fromDir, specifier);
  const candidates = [`${base}.ts`, join(base, 'index.ts'), join(base, 'public-api.ts'), base];
  return candidates.find((candidate) => candidate.endsWith('.ts') && fileExists(candidate)) ?? null;
}

/**
 * Pure rule check for one lib. `imports` maps package name to the list of
 * `{ entry, primary }` sites that import it.
 */
export function checkLib({ lib, pkg, imports, selfScopes = ['@cngx'] }) {
  const violations = [];
  const peers = pkg.peerDependencies ?? {};
  const optional = new Set(
    Object.entries(pkg.peerDependenciesMeta ?? {})
      .filter(([, meta]) => meta?.optional === true)
      .map(([name]) => name),
  );
  const dependencies = pkg.dependencies ?? {};
  const selfName = `@cngx/${lib}`;

  for (const [name, sites] of imports) {
    if (name === selfName || name === '@cngx/testing') {
      continue;
    }
    const declared = name in peers || name in dependencies;
    if (!declared) {
      violations.push({ lib, rule: 'undeclared', detail: `${name} (imported by ${sites[0].entry})` });
    }
    const primarySite = sites.find((site) => site.primary);
    if (optional.has(name) && primarySite) {
      violations.push({ lib, rule: 'optional-in-primary', detail: `${name} (imported by ${primarySite.entry})` });
    }
  }

  for (const name of Object.keys(peers)) {
    const allowed = `${lib}:${name}` in DECLARED_NOT_IMPORTED;
    if (!imports.has(name) && !allowed && !selfScopes.some((scope) => name.startsWith(`${scope}/`))) {
      violations.push({ lib, rule: 'unused-peer', detail: name });
    }
  }
  for (const [name, range] of Object.entries(peers)) {
    if (range.startsWith('~')) {
      violations.push({ lib, rule: 'tilde-peer', detail: `${name} ${range}` });
    }
  }
  for (const name of Object.keys(dependencies)) {
    if (!ALLOWED_DEPENDENCIES.has(name)) {
      violations.push({ lib, rule: 'stray-dependency', detail: name });
    }
  }
  return violations;
}

/** Same external package, different peer range across libs. `@cngx/*` placeholders are exempt. */
export function checkRangeDrift(pkgsByLib) {
  const seen = new Map();
  for (const [lib, pkg] of Object.entries(pkgsByLib)) {
    for (const [name, range] of Object.entries(pkg.peerDependencies ?? {})) {
      if (range === PLACEHOLDER) {
        continue;
      }
      const ranges = seen.get(name) ?? new Map();
      const libs = ranges.get(range) ?? [];
      libs.push(lib);
      ranges.set(range, libs);
      seen.set(name, ranges);
    }
  }
  return [...seen]
    .filter(([, ranges]) => ranges.size > 1)
    .map(([name, ranges]) => ({
      lib: '*',
      rule: 'range-drift',
      detail: `${name}: ${[...ranges].map(([range, libs]) => `${range} (${libs.join(', ')})`).join(' vs ')}`,
    }));
}

function listDirsOnDisk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'schematics')
    .map((entry) => join(dir, entry.name));
}

function loadLib(lib) {
  const libDir = join(ROOT, 'projects', lib);
  const pkg = readJson(join(libDir, 'package.json'));
  const imports = new Map();
  for (const entryDir of findEntries(libDir, listDirsOnDisk)) {
    const entryConfig = readJson(join(entryDir, 'ng-package.json'));
    const entryFile = join(entryDir, entryConfig.lib?.entryFile ?? 'public-api.ts');
    const entryName = entryDir === libDir ? `${lib} (primary)` : entryDir.slice(libDir.length + 1);
    const externals = collectEntryImports(
      entryFile,
      (file) => (existsSync(file) ? readFileSync(file, 'utf8') : null),
      existsSync,
    );
    for (const name of externals.keys()) {
      const sites = imports.get(name) ?? [];
      sites.push({ entry: entryName, primary: entryDir === libDir });
      imports.set(name, sites);
    }
  }
  return { lib, pkg, imports };
}

export function runGuard() {
  const loaded = PUBLISHED_LIBS.map(loadLib);
  const violations = loaded.flatMap(({ lib, pkg, imports }) => checkLib({ lib, pkg, imports }));
  violations.push(...checkRangeDrift(Object.fromEntries(loaded.map(({ lib, pkg }) => [lib, pkg]))));
  return violations;
}

function main() {
  const violations = runGuard();
  if (violations.length === 0) {
    console.log(`peer-deps-guard: ${PUBLISHED_LIBS.length} libs clean`);
    return;
  }
  for (const { lib, rule, detail } of violations) {
    console.error(`  [${rule}] ${lib}: ${detail}`);
  }
  console.error(`\npeer-deps-guard: ${violations.length} violation(s)`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
