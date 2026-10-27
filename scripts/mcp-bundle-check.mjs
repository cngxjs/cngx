#!/usr/bin/env node
// Post-build gate: load the bundled snapshot through the compiled production
// loader and refuse a bundle the server could not serve. compodocx moved to
// schemaVersion 6 while the loader read only 2, and CI built and shipped an
// unreadable bundle while green, because no spec loads packages/mcp/data/.
//
// Runs after `tsc` so the loader in packages/mcp/dist is the only authority on
// supported schema versions; this script never compares version numbers itself.
// Two callers reach different failures:
//
//   - `build:mcp` (last step): mcp-snapshot.mjs has just restamped the bundle,
//     so this catches an unsupported schemaVersion or an empty projection;
//   - `prepublishOnly` in packages/mcp: runs over whatever sits in data/, so it
//     also catches a stale bundle stamped with an older root version.
//
// `--data-dir=<path>` checks another package's bundle (resolved against the repo
// root, so it works from any cwd): `build:cli` and the @cngx/cli `prepublishOnly`
// pass `--data-dir=packages/cli/data`. The loader stays the one in
// packages/mcp/dist: the cli core is a guarded byte copy of the mcp core, so the
// mcp loader is the authority for both bundles.
//
//   node scripts/mcp-bundle-check.mjs
//   node scripts/mcp-bundle-check.mjs --data-dir=packages/cli/data

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DATA_DIR = join('packages', 'mcp', 'data');
const LOADER = join(ROOT, 'packages', 'mcp', 'dist', 'core', 'data', 'loader.js');

/**
 * Load the bundle in `dataDir` and decide whether the server can serve it.
 * Never throws: a loader error becomes `ok: false` carrying its message.
 */
export function checkBundledSnapshot({ dataDir, expectedVersion, loadBundledDocs }) {
  let docs;
  try {
    docs = loadBundledDocs(dataDir);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  const { meta } = docs;
  if (meta.cngxVersion !== expectedVersion) {
    return {
      ok: false,
      message: `bundle is stamped cngxVersion ${meta.cngxVersion}, expected ${expectedVersion}. Run npm run build:mcp.`,
    };
  }
  const counts = { components: docs.components.length, functions: docs.functions.length };
  if (counts.components === 0 || counts.functions === 0) {
    return {
      ok: false,
      message: `bundle loads but is empty: ${counts.components} components, ${counts.functions} functions.`,
    };
  }
  return { ok: true, meta, counts };
}

/**
 * Parse the script arguments into the bundle directory to check. Relative paths
 * resolve against `root`, never the cwd, so `prepublishOnly` in a package
 * directory checks the same path as a root-level run. `label` is the path the
 * output names, relative to `root` with forward slashes.
 */
export function parseBundleCheckArgs(argv, root) {
  let dataDir = DEFAULT_DATA_DIR;
  for (const arg of argv) {
    if (!arg.startsWith('--data-dir=')) {
      return { ok: false, message: `unknown argument ${arg}. Usage: mcp-bundle-check.mjs [--data-dir=<path>]` };
    }
    dataDir = arg.slice('--data-dir='.length);
    if (dataDir === '') {
      return { ok: false, message: '--data-dir needs a path, e.g. --data-dir=packages/cli/data' };
    }
  }
  const absolute = resolve(root, dataDir);
  const label = relative(root, absolute).split(sep).join('/') || '.';
  return { ok: true, dataDir: absolute, label };
}

async function main() {
  const args = parseBundleCheckArgs(process.argv.slice(2), ROOT);
  if (!args.ok) {
    console.error(`mcp-bundle-check: ${args.message}`);
    process.exitCode = 2;
    return;
  }
  if (!existsSync(LOADER)) {
    console.error(`mcp-bundle-check: ${LOADER} not found. Run npm run build:mcp first; its loader checks every bundle.`);
    process.exitCode = 1;
    return;
  }
  const { loadBundledDocs } = await import(pathToFileURL(LOADER).href);
  const expectedVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  const result = checkBundledSnapshot({ dataDir: args.dataDir, expectedVersion, loadBundledDocs });
  if (!result.ok) {
    console.error(`mcp-bundle-check: ${result.message}`);
    process.exitCode = 1;
    return;
  }
  const { meta, counts } = result;
  console.log(
    `mcp-bundle-check: ${args.label}/documentation.json loads ` +
      `(schemaVersion ${meta.schemaVersion}, cngxVersion ${meta.cngxVersion}, ` +
      `${counts.components} components, ${counts.functions} functions).`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`mcp-bundle-check: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
