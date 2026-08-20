// Regenerates the plugin's in-process doctor copy from the canonical package.
// `packages/doctor` is the single source of the engine; the plugin keeps a
// byte-identical copy under `bin/` because its PostToolUse hook imports the
// engine in-process. This script rewrites that copy from the package, and
// `doctor:copy-check` fails CI when it is stale - naming this script as the fix.
//
// RULE ZERO: every write here overwrites a file git already tracks with the
// canonical bytes. This is script-driven regeneration, fully recoverable from
// git, never a hand-delete of anything the script did not itself just produce.
//
// The file list is imported from doctor-copy-check.mjs so the sync and the guard
// can never disagree on which files make up the engine.

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DOCTOR_COPY_FILES } from './doctor-copy-check.mjs';

const PACKAGE_DIR = 'packages/doctor';
const PLUGIN_DIR = 'packages/plugin/bin';

export function syncDoctor() {
  for (const file of DOCTOR_COPY_FILES) {
    const dest = resolve(PLUGIN_DIR, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(PACKAGE_DIR, file), dest);
  }
  return DOCTOR_COPY_FILES.length;
}

function main() {
  const count = syncDoctor();
  process.stdout.write(`doctor:sync - regenerated ${count} plugin copy file(s) from packages/doctor\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
