#!/usr/bin/env node
// Usage:
//   node scripts/build-schematics.mjs <lib>   # one lib
//   node scripts/build-schematics.mjs         # every lib in LIBS with a schematics folder
//
// Bundles projects/<lib>/schematics into dist/<lib>/schematics after
// `ng build <lib>`. ng-packagr secondary entries are browser builds, so the
// schematics ship as a separate CommonJS bundle the way Material and CDK do.
// The Angular devkit, @schematics/angular, typescript and @angular/compiler
// come from the consumer's CLI install; everything else is bundled so the
// package's runtime dependencies stay unchanged.
//
// Every lib other than core ships a thin ng-add shim that delegates to
// @cngx/core. A shim without its own ng-add/schema.json gets core's copied
// in, so `ng add @cngx/<lib> --preset=...` accepts and prompts for the same
// options from one source.

import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui', 'themes'];
const CORE_NG_ADD_SCHEMA = join(ROOT, 'projects', 'core', 'schematics', 'ng-add', 'schema.json');

const EXTERNAL = [
  '@angular-devkit/*',
  '@schematics/angular',
  '@schematics/angular/*',
  'typescript',
  '@angular/compiler',
];

// Folders that are bundled into the entries, never entries themselves.
const NON_ENTRY_DIRS = new Set(['engine', 'shared', 'testing', 'node_modules']);

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

// esbuild strips types without checking them; a type error must fail the
// build, not ship.
function typeCheck(lib, tsconfig) {
  try {
    execFileSync(process.execPath, [TSC, '-p', tsconfig, '--noEmit'], { cwd: ROOT, stdio: 'inherit' });
  } catch {
    fail(`type errors in projects/${lib}/schematics.`);
  }
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

  const tsconfig = join(srcRoot, 'tsconfig.json');
  typeCheck(lib, tsconfig);

  await build({
    entryPoints: entries,
    outdir: outRoot,
    outbase: srcRoot,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    external: EXTERNAL,
    tsconfig,
    minify: true,
    logLevel: 'warning',
    legalComments: 'none',
  });

  for (const file of ['collection.json', join('migrations', 'migrations.json'), ...schemaFiles(srcRoot)]) {
    copyInto(srcRoot, outRoot, file);
  }
  const shimSchema = join(outRoot, 'ng-add', 'schema.json');
  if (lib !== 'core' && existsSync(join(outRoot, 'ng-add')) && !existsSync(shimSchema)) {
    copyFileSync(CORE_NG_ADD_SCHEMA, shimSchema);
  }

  console.log(`build-schematics: dist/${lib}/schematics (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
}

const requested = process.argv[2];
if (requested && !LIBS.includes(requested)) {
  fail(`unknown lib "${requested}". Expected one of: ${LIBS.join(', ')}.`);
}

const libs = requested
  ? [requested]
  : LIBS.filter((lib) => existsSync(join(ROOT, 'projects', lib, 'schematics')));
for (const lib of libs) {
  await buildLib(lib);
}
