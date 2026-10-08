#!/usr/bin/env node
// Usage:
//   node scripts/build-schematics.mjs <lib>
//
// Bundles projects/<lib>/schematics into dist/<lib>/schematics after
// `ng build <lib>`. ng-packagr secondary entries are browser builds, so the
// schematics ship as a separate CommonJS bundle the way Material and CDK do.
// The Angular devkit, @schematics/angular, typescript and @angular/compiler
// come from the consumer's CLI install; everything else is bundled so the
// package's runtime dependencies stay unchanged.

import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXTERNAL = [
  '@angular-devkit/*',
  '@schematics/angular',
  '@schematics/angular/*',
  'typescript',
  '@angular/compiler',
];

// Folders that are bundled into the entries, never entries themselves.
const NON_ENTRY_DIRS = new Set(['engine', 'testing', 'node_modules']);

function fail(message) {
  console.error(`build-schematics: ${message}`);
  process.exit(1);
}

function entryPoints(srcRoot) {
  return readdirSync(srcRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_ENTRY_DIRS.has(entry.name))
    .map((entry) => join(srcRoot, entry.name, 'index.ts'))
    .filter((file) => existsSync(file));
}

function copyInto(srcRoot, outRoot, relativePath) {
  const from = join(srcRoot, relativePath);
  if (!existsSync(from)) {
    return;
  }
  const to = join(outRoot, relativePath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

function schemaFiles(srcRoot) {
  return readdirSync(srcRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_ENTRY_DIRS.has(entry.name))
    .map((entry) => join(entry.name, 'schema.json'))
    .filter((file) => existsSync(join(srcRoot, file)));
}

async function buildLib(lib) {
  const srcRoot = join(ROOT, 'projects', lib, 'schematics');
  const distRoot = join(ROOT, 'dist', lib);
  const outRoot = join(distRoot, 'schematics');

  if (!existsSync(srcRoot)) {
    fail(`projects/${lib}/schematics does not exist.`);
  }
  if (!existsSync(join(distRoot, 'package.json'))) {
    fail(`dist/${lib}/package.json is missing. Run "ng build ${lib}" first.`);
  }

  const entries = entryPoints(srcRoot);
  if (entries.length === 0) {
    fail(`projects/${lib}/schematics has no <folder>/index.ts entry.`);
  }

  await build({
    entryPoints: entries,
    outdir: outRoot,
    outbase: srcRoot,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: EXTERNAL,
    tsconfig: join(srcRoot, 'tsconfig.json'),
    logLevel: 'warning',
    legalComments: 'none',
  });

  for (const file of ['collection.json', join('migrations', 'migrations.json'), ...schemaFiles(srcRoot)]) {
    copyInto(srcRoot, outRoot, file);
  }

  console.log(`build-schematics: dist/${lib}/schematics (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
}

const lib = process.argv[2];
if (!lib) {
  fail('usage: node scripts/build-schematics.mjs <lib>');
}

await buildLib(lib);
