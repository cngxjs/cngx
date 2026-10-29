// Regenerates the @cngx/cli core copy from the canonical tree in packages/mcp.
// `packages/mcp/src/core/` is the single source; `cli:copy-check` fails CI when
// `packages/cli/src/core/` is stale and names this script as the fix.
//
// RULE ZERO: every write and every removal here stays inside
// packages/cli/src/core/, a generated directory git tracks in full. A removed
// file is one that no longer exists in the canonical tree, so it is recoverable
// from git. Nothing outside that directory is touched. A canonical tree that is
// missing or holds no core files is a broken checkout, not an empty core: the
// sync refuses and deletes nothing, instead of removing the whole copy.
//
// The file walk and both tree paths (resolved from the repo root, not cwd) are
// imported from cli-core-copy-check.mjs so the sync and the guard can never
// disagree on which files make up the core.
//
//   node scripts/sync-cli-core.mjs

import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CANONICAL_CORE_DIR,
  COPY_CORE_DIR,
  displayPath,
  listCoreFiles,
  listStrayFiles,
  missingTrees,
} from './cli-core-copy-check.mjs';

/**
 * Regenerate `copyDir` from `canonicalDir`. Returns `{ copied, removed, stray }`
 * (`stray`: spec files and dotfiles in the copy, reported and never deleted), or
 * `{ refused }` with the reason when the canonical tree is missing or empty, in
 * which case nothing was written or removed. The dirs are injectable for specs.
 */
export function syncCliCore({ canonicalDir = CANONICAL_CORE_DIR, copyDir = COPY_CORE_DIR } = {}) {
  if (missingTrees(canonicalDir, copyDir).includes(canonicalDir)) {
    return { refused: `${displayPath(canonicalDir)} does not exist (${canonicalDir}); nothing was synced or removed.` };
  }
  const canonical = listCoreFiles(canonicalDir);
  if (canonical.length === 0) {
    return { refused: `${displayPath(canonicalDir)} holds no core files; nothing was synced or removed.` };
  }
  const keep = new Set(canonical);
  const removed = listCoreFiles(copyDir).filter((file) => !keep.has(file));

  for (const file of canonical) {
    const dest = resolve(copyDir, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(canonicalDir, file), dest);
  }
  for (const file of removed) {
    rmSync(resolve(copyDir, file));
  }
  return { copied: canonical.length, removed, stray: listStrayFiles(copyDir) };
}

function main() {
  const result = syncCliCore();
  if (result.refused !== undefined) {
    process.stderr.write(`cli:sync - refused: ${result.refused}\n`);
    process.exitCode = 1;
    return;
  }
  const { copied, removed, stray } = result;
  process.stdout.write(
    `cli:sync - regenerated ${copied} file(s) in ${displayPath(COPY_CORE_DIR)} from ${displayPath(CANONICAL_CORE_DIR)}\n`,
  );
  for (const file of removed) {
    process.stdout.write(`  removed ${file} (no longer in the canonical tree)\n`);
  }
  for (const file of stray) {
    process.stdout.write(`  kept ${file} (spec or dotfile; cli:sync never deletes it, cli:copy-check fails until it is removed)\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
