#!/usr/bin/env node
// Runs before `lint` and `test:scripts`: the lib tsconfigs resolve their
// cross-lib types from dist/ and the schematics smoke runs the built
// bundles, so a fresh checkout fails both with errors that do not name the
// cause. This names it.
//
//   node scripts/require-dist.mjs

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PACKED_LIBS } from './cngx-libs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Every package whose built manifest is missing under `<root>/dist`, in build order. */
export function missingDist(root, exists = existsSync) {
  return PACKED_LIBS.filter((lib) => !exists(join(root, 'dist', lib, 'package.json')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = missingDist(ROOT);
  for (const lib of missing) {
    console.error(`dist/${lib} is missing: run npm run build:libs first`);
  }
  process.exitCode = missing.length > 0 ? 1 : 0;
}
