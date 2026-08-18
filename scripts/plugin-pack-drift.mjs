// The pack's maintenance guard. pack-manifest.json's `sources[]` records, per
// generated artifact, the COMMITTED source it was distilled from and that
// source's content hash at generation time. This recomputes each source hash
// against the file on disk now and fails when any has moved or vanished - the
// shipped artifact is then stale and its generator must be re-run.
//
// Only committed sources belong in `sources[]`: recipes, whose sources are the
// example stories. The theming reference is distilled from documentation.json,
// a gitignored build artifact, so it has no committed source to re-hash on a
// fresh checkout; its provenance lives under `manifest.theming` and is not
// drift-checked here. It is refreshed at release time via plugin:release.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MANIFEST = 'packages/plugin/pack/pack-manifest.json';

const sha256 = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

// readSource returns the source bytes, or null when the source no longer
// exists. Injected so the check is testable without touching disk.
export function computeDrift(manifest, readSource) {
  const drifted = [];
  for (const entry of manifest.sources ?? []) {
    const bytes = readSource(entry.source);
    if (bytes === null) {
      drifted.push({ artifact: entry.artifact, source: entry.source, reason: 'source missing' });
      continue;
    }
    const actual = sha256(bytes);
    if (actual !== entry.contentHash) {
      drifted.push({ artifact: entry.artifact, source: entry.source, reason: 'hash changed' });
    }
  }
  return drifted;
}

function readSourceFile(path) {
  const abs = resolve(path);
  return existsSync(abs) ? readFileSync(abs) : null;
}

function main() {
  const manifest = JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'));
  const drifted = computeDrift(manifest, readSourceFile);
  const total = (manifest.sources ?? []).length;

  if (drifted.length === 0) {
    process.stdout.write(`plugin:drift - pack is in sync (${total} sources)\n`);
    return;
  }

  process.stdout.write(`plugin:drift - ${drifted.length} of ${total} artifact(s) stale:\n`);
  for (const entry of drifted) {
    process.stdout.write(`  ${entry.artifact} <- ${entry.source} (${entry.reason})\n`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
