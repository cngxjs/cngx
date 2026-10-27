// Regenerates the @cngx/cli core copy from the canonical tree in packages/mcp.
// `packages/mcp/src/core/` is the single source; `cli:copy-check` fails CI when
// `packages/cli/src/core/` is stale and names this script as the fix.
//
// RULE ZERO: every write and every removal here stays inside
// packages/cli/src/core/, a generated directory git tracks in full. A removed
// file is one that no longer exists in the canonical tree, so it is recoverable
// from git. Nothing outside that directory is touched.
//
// The file walk is imported from cli-core-copy-check.mjs so the sync and the
// guard can never disagree on which files make up the core.
//
//   node scripts/sync-cli-core.mjs

import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CANONICAL_CORE_DIR, COPY_CORE_DIR, listCoreFiles } from './cli-core-copy-check.mjs';

export function syncCliCore() {
  const canonical = listCoreFiles(CANONICAL_CORE_DIR);
  const keep = new Set(canonical);
  const removed = listCoreFiles(COPY_CORE_DIR).filter((file) => !keep.has(file));

  for (const file of canonical) {
    const dest = resolve(COPY_CORE_DIR, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(CANONICAL_CORE_DIR, file), dest);
  }
  for (const file of removed) {
    rmSync(resolve(COPY_CORE_DIR, file));
  }
  return { copied: canonical.length, removed };
}

function main() {
  const { copied, removed } = syncCliCore();
  process.stdout.write(`cli:sync - regenerated ${copied} file(s) in ${COPY_CORE_DIR} from ${CANONICAL_CORE_DIR}\n`);
  for (const file of removed) {
    process.stdout.write(`  removed ${file} (no longer in the canonical tree)\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
