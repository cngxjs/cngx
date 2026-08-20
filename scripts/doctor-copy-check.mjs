// The "one engine, not two" guard. `packages/doctor` is the canonical home of
// the project-wiring engine; the plugin keeps a byte-identical copy under `bin/`
// because its PostToolUse hook imports the engine in-process for a warm
// per-project snapshot cache and a Claude plugin never `npm install`s its deps.
// This asserts the two are byte-for-byte equal and exits non-zero on any drift,
// naming `npm run doctor:sync` as the fix.
//
// Byte equality is the deliberate choice over the pack's `sources[]`/computeDrift
// hash mechanism: that only re-hashes the SOURCE, so it catches "canonical
// edited, copy stale" but NOT "copy edited directly, canonical untouched". The
// plugin copy is the file the hook actually executes, so an in-place edit there
// is the likelier mistake; a direction-agnostic equality check catches both.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PACKAGE_DIR = 'packages/doctor';
const PLUGIN_DIR = 'packages/plugin/bin';

// The engine files that must stay identical between the canonical package and
// the plugin's in-process copy, relative to each base.
export const DOCTOR_COPY_FILES = [
  'cngx-doctor.mjs',
  'doctor/checks.mjs',
  'doctor/scan.mjs',
  'doctor/metadata.mjs',
  'doctor/track-b-symbols.mjs',
];

// readPackage/readPlugin return the file bytes (Buffer), or null when the file
// is absent. Injected so the check is testable without touching disk, mirroring
// computeDrift's shape in scripts/plugin-pack-drift.mjs.
export function compareCopies(readPackage, readPlugin, files) {
  const mismatches = [];
  for (const file of files) {
    const a = readPackage(file);
    const b = readPlugin(file);
    if (a === null) {
      mismatches.push({ file, reason: 'missing in packages/doctor' });
      continue;
    }
    if (b === null) {
      mismatches.push({ file, reason: 'missing in the plugin copy' });
      continue;
    }
    if (!a.equals(b)) {
      mismatches.push({ file, reason: 'bytes differ' });
    }
  }
  return mismatches;
}

const readUnder = (base) => (file) => {
  const abs = resolve(base, file);
  return existsSync(abs) ? readFileSync(abs) : null;
};

function main() {
  const mismatches = compareCopies(readUnder(PACKAGE_DIR), readUnder(PLUGIN_DIR), DOCTOR_COPY_FILES);
  const total = DOCTOR_COPY_FILES.length;

  if (mismatches.length === 0) {
    process.stdout.write(`doctor:copy-check - plugin copy is byte-identical (${total} files)\n`);
    return;
  }

  process.stdout.write(`doctor:copy-check - ${mismatches.length} of ${total} file(s) diverged:\n`);
  for (const entry of mismatches) {
    process.stdout.write(`  ${entry.file} (${entry.reason})\n`);
  }
  process.stdout.write('Fix: run `npm run doctor:sync` to regenerate the plugin copy from packages/doctor.\n');
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
