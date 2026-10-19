#!/usr/bin/env node
// Usage:
//   node scripts/build-schematics.mjs <lib>   # one lib
//   node scripts/build-schematics.mjs         # every lib in PACKED_LIBS with a schematics folder
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
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { builtinModules, createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKED_LIBS } from './cngx-libs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const CORE_NG_ADD_SCHEMA = join(ROOT, 'projects', 'core', 'schematics', 'ng-add', 'schema.json');

const EXTERNAL = [
  '@angular-devkit/*',
  '@schematics/angular',
  '@schematics/angular/*',
  'typescript',
  '@angular/compiler',
];

// The vendored TypeScript of @schematics/angular 21 is gone in 22, which
// depends on `typescript` instead; a bundle that reaches into it crashes
// `ng add` at load time on the newer CLI. Import `typescript` directly, the
// way @angular/cdk and @angular/material schematics do.
const FORBIDDEN_EXTERNAL = /^@schematics\/angular\/third_party\//;

// Folders that are bundled into the entries, never entries themselves.
const NON_ENTRY_DIRS = new Set(['engine', 'testing', 'node_modules']);

function fail(message) {
  console.error(`build-schematics: ${message}`);
  process.exit(1);
}

function isNodeBuiltin(specifier) {
  return specifier.startsWith('node:') || builtinModules.includes(specifier);
}

function isDeclaredExternal(specifier) {
  return EXTERNAL.some((pattern) =>
    pattern.endsWith('/*') ? specifier.startsWith(pattern.slice(0, -1)) : specifier === pattern,
  );
}

// Every require left in a bundle is resolved from the consumer's install, so
// it must be a Node builtin or a declared external, never a private path of
// one.
function assertExternalRequires(lib, outRoot) {
  const offenders = [];
  const bundles = readdirSync(outRoot, { recursive: true }).filter((file) => String(file).endsWith('.js'));
  for (const file of bundles) {
    const code = readFileSync(join(outRoot, file), 'utf8');
    for (const [, specifier] of code.matchAll(/\brequire\("([^"]+)"\)/g)) {
      if (specifier.startsWith('.') || isNodeBuiltin(specifier)) {
        continue;
      }
      if (FORBIDDEN_EXTERNAL.test(specifier) || !isDeclaredExternal(specifier)) {
        offenders.push(`dist/${lib}/schematics/${file}: require("${specifier}")`);
      }
    }
  }
  if (offenders.length > 0) {
    fail(`bundles require modules the consumer's CLI install does not provide:\n  ${offenders.join('\n  ')}`);
  }
}

// ng-packagr's .npmignore drops every nested package.json (`**/package.json`,
// the secondary entries' manifests). The schematics marker must ship.
const SCHEMATICS_MANIFEST_RULE = '!schematics/package.json';

function keepSchematicsManifestPacked(distRoot) {
  const npmignore = join(distRoot, '.npmignore');
  const current = existsSync(npmignore) ? readFileSync(npmignore, 'utf8') : '';
  if (current.split(/\r?\n/).includes(SCHEMATICS_MANIFEST_RULE)) {
    return;
  }
  const separator = current === '' || current.endsWith('\n') ? '' : '\n';
  writeFileSync(npmignore, `${current}${separator}${SCHEMATICS_MANIFEST_RULE}\n`);
}

function indexFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_ENTRY_DIRS.has(entry.name))
    .map((entry) => join(dir, entry.name, 'index.ts'))
    .filter((file) => existsSync(file));
}

// One entry per schematic folder, plus one per migration under
// migrations/<version>/, which migrations.json names as its factory.
function entryPoints(srcRoot) {
  const migrations = join(srcRoot, 'migrations');
  return [...indexFiles(srcRoot), ...(existsSync(migrations) ? indexFiles(migrations) : [])];
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

// The source collections point `$schema` at the workspace's node_modules for
// the editor; a consumer's install has no such path, so the shipped copy
// leaves the key out.
function copyCollection(srcRoot, outRoot, relativePath) {
  const from = join(srcRoot, relativePath);
  if (!existsSync(from)) {
    return;
  }
  const { $schema: _schema, ...collection } = JSON.parse(readFileSync(from, 'utf8'));
  const to = join(outRoot, relativePath);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, `${JSON.stringify(collection, null, 2)}\n`);
}

/**
 * The `files/` folder of every schematic, the Angular convention for the
 * template files a schematic reads at run time. They ship next to the
 * bundle instead of inside it (the ng-add starter's page files), so the
 * bundle stays inside its size budget.
 */
function runtimeFileDirs(srcRoot) {
  return readdirSync(srcRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_ENTRY_DIRS.has(entry.name))
    .map((entry) => join(entry.name, 'files'))
    .filter((dir) => existsSync(join(srcRoot, dir)));
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
    loader: { '.tpl': 'text' },
  });
  assertExternalRequires(lib, outRoot);

  for (const file of ['collection.json', join('migrations', 'migrations.json')]) {
    copyCollection(srcRoot, outRoot, file);
  }
  for (const file of schemaFiles(srcRoot)) {
    copyInto(srcRoot, outRoot, file);
  }
  for (const dir of runtimeFileDirs(srcRoot)) {
    cpSync(join(srcRoot, dir), join(outRoot, dir), { recursive: true });
  }
  // ng-packagr 22 writes "type": "module" into dist/<lib>/package.json, which
  // would load these CommonJS .js bundles as ESM. The nearest package.json
  // wins, so the schematics folder pins its own module type.
  writeFileSync(join(outRoot, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
  keepSchematicsManifestPacked(distRoot);
  const shimSchema = join(outRoot, 'ng-add', 'schema.json');
  if (lib !== 'core' && existsSync(join(outRoot, 'ng-add')) && !existsSync(shimSchema)) {
    copyFileSync(CORE_NG_ADD_SCHEMA, shimSchema);
  }

  console.log(`build-schematics: dist/${lib}/schematics (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
}

const requested = process.argv[2];
if (requested && !PACKED_LIBS.includes(requested)) {
  fail(`unknown lib "${requested}". Expected one of: ${PACKED_LIBS.join(', ')}.`);
}

const libs = requested
  ? [requested]
  : PACKED_LIBS.filter((lib) => existsSync(join(ROOT, 'projects', lib, 'schematics')));
for (const lib of libs) {
  await buildLib(lib);
}
