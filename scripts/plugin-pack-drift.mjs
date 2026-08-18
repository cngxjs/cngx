// The pack's maintenance guard. pack-manifest.json records, per generated
// artifact, the source it was distilled from and that source's content hash at
// generation time. This recomputes each source hash against the file on disk
// now and fails when any has moved - the shipped artifact is then stale and its
// generator must be re-run.
//
// The hash is over the whole source file. For a recipe that is its story (a
// precise signal). For pack/theming-tokens.md the source is the compodoc
// documentation.json, so any doc change trips the check even when no --cngx-*
// token moved. That is deliberate: a false positive costs one regeneration; a
// false negative would ship a stale token reference. Hashing only the token
// projection would need this guard to import each generator, and the coupling
// is not worth the reduced noise.

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
