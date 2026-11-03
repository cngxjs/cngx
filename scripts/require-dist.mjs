#!/usr/bin/env node
// Runs before `lint` and `test:scripts`: the lib tsconfigs resolve their
// cross-lib types from dist/ and the schematics smoke runs the built
// bundles, so a fresh checkout fails both with errors that do not name the
// cause. This names it. `test:scripts` passes --docs: the public-API doc
// guards read the compodoc JSON, which only `npm run docs:json` writes.
//
//   node scripts/require-dist.mjs [--docs]

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PACKED_LIBS } from './cngx-libs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Every package whose built manifest is missing under `<root>/dist`, in build order. */
export function missingDist(root, exists = existsSync) {
  return PACKED_LIBS.filter((lib) => !exists(join(root, 'dist', lib, 'package.json')));
}

/** The compodoc JSON path relative to `<root>` when it is missing, else `null`. */
export function missingDocsJson(root, exists = existsSync) {
  const path = join('.compodoc', 'documentation.json');
  return exists(join(root, path)) ? null : path;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = missingDist(ROOT);
  for (const lib of missing) {
    console.error(`dist/${lib} is missing: run npm run build:libs first`);
  }
  const docs = process.argv.includes('--docs') ? missingDocsJson(ROOT) : null;
  if (docs) {
    console.error(`${docs} is missing: run npm run docs:json first`);
  }
  process.exitCode = missing.length > 0 || docs ? 1 : 0;
}
