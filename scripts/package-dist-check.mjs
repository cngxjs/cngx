#!/usr/bin/env node
// Prepublish gate: refuse a package whose `dist/index.js` is missing or older
// than the newest file its `tsconfig.json` compiles. `cli:sync` rewrites
// packages/cli/src/core, and a publish after a sync without a rebuild would
// ship the old core.
//
// The compiled set is read from the build config (`include` minus `exclude`),
// so a spec-only edit never refuses a fresh build. Only the pattern forms the
// packages use today are understood. Any other form, a missing `include`, or an
// `extends` / `files` field exits 1 naming it, so a tsconfig change cannot
// silently widen or narrow the set.
//
//   node ../../scripts/package-dist-check.mjs --package-dir=.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const toPosix = (path) => path.split(sep).join('/');

// `src/**/*.ts`, `src/**/*.spec.ts`: everything under a base dir with a suffix.
const RECURSIVE_SUFFIX = /^([^*]+)\/\*\*\/\*(\.[\w.-]+)$/;
// `src/testing/**`: everything under a dir.
const RECURSIVE_DIR = /^([^*]+)\/\*\*$/;

/** A path predicate for one `exclude` entry; throws on an unsupported form. */
function excludeMatcher(pattern) {
  const suffix = RECURSIVE_SUFFIX.exec(pattern);
  if (suffix) {
    return (path) => path.startsWith(`${suffix[1]}/`) && path.endsWith(suffix[2]);
  }
  const dir = RECURSIVE_DIR.exec(pattern);
  if (dir) {
    return (path) => path.startsWith(`${dir[1]}/`);
  }
  if (!pattern.includes('*')) {
    // `dist`, `node_modules` (a dir) or `src/readme-guard.ts` (a file).
    return (path) => path === pattern || path.startsWith(`${pattern}/`);
  }
  throw new Error(`unsupported tsconfig exclude form '${pattern}'`);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = join(dir, entry.name);
    return entry.isDirectory() ? walk(abs) : [abs];
  });
}

/**
 * The package-relative paths `tsconfig.json` compiles: `include` minus `exclude`.
 * Throws on an include or exclude form the check does not understand.
 */
export function compiledSources(packageDir) {
  const config = JSON.parse(readFileSync(join(packageDir, 'tsconfig.json'), 'utf8'));
  // Fields that change the compiled set but are not read here would make the
  // check pass on a set it never saw, so they refuse instead.
  for (const field of ['extends', 'files']) {
    if (field in config) {
      throw new Error(`tsconfig field '${field}' is not read by this check`);
    }
  }
  if (!Array.isArray(config.include) || config.include.length === 0) {
    throw new Error('tsconfig has no include; the compiled set would be empty');
  }
  const excluded = (config.exclude ?? []).map(excludeMatcher);
  const files = new Set();
  for (const pattern of config.include) {
    const match = RECURSIVE_SUFFIX.exec(pattern);
    if (!match) {
      throw new Error(`unsupported tsconfig include form '${pattern}'`);
    }
    const base = join(packageDir, match[1]);
    if (!existsSync(base)) {
      continue;
    }
    for (const abs of walk(base)) {
      const path = toPosix(relative(packageDir, abs));
      if (path.endsWith(match[2]) && !excluded.some((isExcluded) => isExcluded(path))) {
        files.add(path);
      }
    }
  }
  return [...files].sort();
}

function buildScript(packageDir) {
  const name = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).name ?? '';
  return `npm run build:${name.replace(/^@cngx\//, '')}`;
}

/** `{ ok: true }`, or `{ ok: false, message }` when dist/index.js is missing, stale or the config unsupported. */
export function checkDist(packageDir) {
  let sources;
  try {
    sources = compiledSources(packageDir);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  const entry = join(packageDir, 'dist', 'index.js');
  if (!existsSync(entry)) {
    return { ok: false, message: `dist/index.js is missing. Run ${buildScript(packageDir)}.` };
  }
  const built = statSync(entry).mtimeMs;
  const newer = sources.filter((path) => statSync(join(packageDir, path)).mtimeMs > built);
  if (newer.length > 0) {
    return {
      ok: false,
      message: `dist/index.js is older than ${newer.length} compiled source(s), e.g. ${newer[0]}. Run ${buildScript(packageDir)}.`,
    };
  }
  return { ok: true, count: sources.length };
}

function parseArgs(argv) {
  const flag = argv.find((arg) => arg.startsWith('--package-dir='));
  return flag ? resolve(flag.slice('--package-dir='.length)) : null;
}

function main() {
  const packageDir = parseArgs(process.argv.slice(2));
  if (packageDir === null) {
    console.error('package-dist-check: pass --package-dir=<dir>.');
    process.exitCode = 1;
    return;
  }
  const result = checkDist(packageDir);
  if (!result.ok) {
    console.error(`package-dist-check: ${result.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`package-dist-check: dist/index.js is newer than its ${result.count} compiled sources.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
