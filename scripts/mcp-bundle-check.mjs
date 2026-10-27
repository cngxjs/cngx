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
//   node scripts/mcp-bundle-check.mjs

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'packages', 'mcp', 'data');
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

async function main() {
  const { loadBundledDocs } = await import(pathToFileURL(LOADER).href);
  const expectedVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  const result = checkBundledSnapshot({ dataDir: DATA_DIR, expectedVersion, loadBundledDocs });
  if (!result.ok) {
    console.error(`mcp-bundle-check: ${result.message}`);
    process.exitCode = 1;
    return;
  }
  const { meta, counts } = result;
  console.log(
    `mcp-bundle-check: packages/mcp/data/documentation.json loads ` +
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
