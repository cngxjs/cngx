#!/usr/bin/env node
// Moves a disposable checkout of this workspace onto another Angular major
// (or an exact Angular release, e.g. the 21.0.0 floor of the peer range), so
// the libs can be built and unit tested there with the same sources. The
// repo itself keeps building and publishing with the toolchain in
// package.json; this script is for compatibility runs only (the
// angular-22-libs CI job and local probes).
//
// It rewrites the root package.json (every Angular package, the devkit, the
// CLI schematics, angular-eslint, ng-packagr, @ngrx/signals,
// playwright-ng-schematics and TypeScript, the latter to the range the target
// @angular/compiler-cli peers on), lets an installed TypeScript 6 accept the
// deprecated `baseUrl` in tsconfig.base.json, and runs the install.
//
// Usage:
//   node scripts/toolchain-overlay.mjs --angular 22 [--before 2026-10-20] [--force] [--no-install] [--dry-run]
//   node scripts/toolchain-overlay.mjs --angular 21.1.0 --force
//   node scripts/toolchain-overlay.mjs --restore        # back to the committed toolchain
//
// `--before` resolves every version as the registry stood on that date, so a
// CI run is the same every day until the date is moved on purpose. It needs
// no installed node_modules, so CI runs it instead of `npm ci`.
//
// A major moves every package to its newest release of that major. An exact
// release pins only the framework (the @angular/* runtime and compiler
// packages and @ngrx/signals) and keeps the workspace's own build tooling:
// the floor run is about the Angular a consumer runs, and older unit-test
// builders lack features the test setup relies on.
//
// Refuses to run outside CI (CI=true) unless --force is passed, and refuses on
// a dirty tree: the rewrite is not meant to be committed. It never restores a
// checkout on its own; it prints the command (`--restore`) after every run.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Packages whose major moves with Angular's major. */
export function followsAngularMajor(name) {
  return (
    name.startsWith('@angular/') ||
    name.startsWith('@angular-devkit/') ||
    name.startsWith('@angular-eslint/') ||
    name === '@schematics/angular' ||
    name === 'ng-packagr' ||
    name === '@ngrx/signals' ||
    name === 'playwright-ng-schematics'
  );
}

/** The framework part of the Angular family: what an app runs and compiles with, not the CLI tooling. */
export function isFrameworkPackage(name) {
  return (name.startsWith('@angular/') && name !== '@angular/build' && name !== '@angular/cli') || name === '@ngrx/signals';
}

/** Every dependency name in the manifest that the overlay moves, sorted; `frameworkOnly` for an exact release. */
export function overlayTargets(manifest, frameworkOnly = false) {
  const names = new Set();
  const moves = frameworkOnly ? isFrameworkPackage : followsAngularMajor;
  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (moves(name)) {
        names.add(name);
      }
    }
  }
  return [...names].sort();
}

/**
 * What `--angular` asks for: a major (`22`) or an exact release (`21.0.0`).
 * `range` is the npm range each package is resolved in.
 */
export function parseAngularTarget(spec) {
  if (/^\d+$/.test(spec ?? '')) {
    return { exact: undefined, range: spec };
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(spec ?? '');
  if (match) {
    return { exact: spec, range: `~${match[1]}.${match[2]}.0` };
  }
  throw new Error('toolchain-overlay: pass a major (--angular 22) or an exact release (--angular 21.0.0)');
}

/**
 * The manifest with each target set to its resolved version. An exact pin
 * stays exact, any other range becomes `^version`; with `pinAll` every target
 * is pinned. `typescript` is set to the range given as `typescriptRange`.
 */
export function overlayManifest(manifest, versions, typescriptRange, pinAll = false) {
  const next = structuredClone(manifest);
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = next[field];
    if (!deps) {
      continue;
    }
    for (const name of Object.keys(deps)) {
      const version = versions[name];
      if (version) {
        deps[name] = pinAll || /^\d/.test(deps[name]) ? version : `^${version}`;
      }
    }
    if (typescriptRange && deps['typescript']) {
      deps['typescript'] = typescriptRange;
    }
  }
  return next;
}

/** The TypeScript range a compiler-cli peer names, as an npm range the installer accepts. */
export function typescriptRangeFromPeer(peerRange) {
  if (typeof peerRange !== 'string' || peerRange.trim() === '') {
    throw new Error('toolchain-overlay: @angular/compiler-cli names no typescript peer');
  }
  return peerRange.trim();
}

/**
 * tsconfig.base.json text with `ignoreDeprecations: "6.0"` in compilerOptions,
 * so TypeScript 6 accepts the `baseUrl` that 5.9 still needs. Text in, text
 * out, so the rest of the file keeps its formatting.
 */
export function patchTsconfigForTs6(text) {
  if (text.includes('"ignoreDeprecations"')) {
    return text;
  }
  const anchor = /"compilerOptions"\s*:\s*\{/;
  if (!anchor.test(text)) {
    throw new Error('toolchain-overlay: tsconfig.base.json has no compilerOptions block');
  }
  return text.replace(anchor, (match) => `${match}\n    "ignoreDeprecations": "6.0",`);
}

/** The files the overlay rewrites; `--restore` checks them out again. */
export const OVERLAID_FILES = ['package.json', 'package-lock.json', 'tsconfig.base.json'];

/** How to put a developer checkout back after an overlay run. */
export const RESTORE_HINT =
  `Restore the checkout with: node scripts/toolchain-overlay.mjs --restore ` +
  `(git checkout -- ${OVERLAID_FILES.join(' ')} && npm ci)`;

/** The major of an installed TypeScript version string, or undefined. */
export function typescriptMajorOf(version) {
  const match = /^(\d+)\./.exec(version ?? '');
  return match ? Number(match[1]) : undefined;
}

/** `--before` as npm takes it: a calendar date, so the resolution is the same on every run. */
export function parseBefore(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    throw new Error('toolchain-overlay: --before takes a date, e.g. --before 2026-10-20');
  }
  return value;
}

export function parseArgs(argv) {
  const args = { angular: undefined, force: false, install: true, dryRun: false, restore: false, before: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--angular') {
      args.angular = argv[++i];
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--no-install') {
      args.install = false;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--restore') {
      args.restore = true;
    } else if (arg === '--before') {
      args.before = parseBefore(argv[++i]);
    } else {
      throw new Error(`toolchain-overlay: unknown argument ${arg}`);
    }
  }
  if (args.restore) {
    return { ...args, target: undefined };
  }
  return { ...args, target: parseAngularTarget(args.angular) };
}

function beforeFlag(before) {
  return before ? [`--before=${before}`] : [];
}

function npmView(spec, field, before) {
  const out = execFileSync('npm', ['view', spec, field, '--json', ...beforeFlag(before)], { encoding: 'utf8' }).trim();
  return out ? JSON.parse(out) : undefined;
}

/** The version to install: the exact release when the package published it, else the newest stable one in range. */
function resolveVersion(name, { exact, range }, before) {
  const result = npmView(`${name}@${range}`, 'version', before);
  const list = (Array.isArray(result) ? result : [result]).filter((v) => typeof v === 'string' && !v.includes('-'));
  if (exact && list.includes(exact)) {
    return exact;
  }
  if (list.length === 0) {
    throw new Error(`toolchain-overlay: ${name} has no stable release in ${range}`);
  }
  return list[list.length - 1];
}

function dirtyFiles() {
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

function installedTypescriptVersion() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'node_modules', 'typescript', 'package.json'), 'utf8')).version;
  } catch {
    return undefined;
  }
}

function restore(install) {
  execFileSync('git', ['checkout', '--', ...OVERLAID_FILES], { cwd: ROOT, stdio: 'inherit' });
  if (install) {
    execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit' });
  }
  console.log(`Restored ${OVERLAID_FILES.join(', ')}${install ? ' and node_modules' : ''}.`);
}

function overlay(args) {
  const manifestPath = join(ROOT, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const exact = args.target.exact !== undefined;
  const versions = {};
  for (const name of overlayTargets(manifest, exact)) {
    versions[name] = resolveVersion(name, args.target, args.before);
  }
  const compilerCli = versions['@angular/compiler-cli'];
  const tsRange = typescriptRangeFromPeer(
    npmView(`@angular/compiler-cli@${compilerCli}`, 'peerDependencies.typescript', args.before),
  );

  for (const [name, version] of Object.entries(versions)) {
    console.log(`  ${name} -> ${version}`);
  }
  console.log(`  typescript -> ${tsRange}`);
  if (args.dryRun) {
    return;
  }

  writeFileSync(manifestPath, `${JSON.stringify(overlayManifest(manifest, versions, tsRange, exact), null, 2)}\n`);
  if (!args.install) {
    console.log('  --no-install: tsconfig.base.json is left alone; the installed TypeScript decides it on the install run.');
    return;
  }
  // The repo's own peers still name the old major until the overlay is
  // promoted, and tools like typescript-eslint lag a TypeScript major.
  execFileSync(
    'npm',
    ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund', ...beforeFlag(args.before)],
    { cwd: ROOT, stdio: 'inherit' },
  );
  const typescript = installedTypescriptVersion();
  if ((typescriptMajorOf(typescript) ?? 0) >= 6) {
    const tsconfigPath = join(ROOT, 'tsconfig.base.json');
    writeFileSync(tsconfigPath, patchTsconfigForTs6(readFileSync(tsconfigPath, 'utf8')));
    console.log(`  TypeScript ${typescript}: tsconfig.base.json accepts the deprecated baseUrl (ignoreDeprecations 6.0)`);
  }
  execFileSync('npm', ['ls', '@angular/core', '@angular/build', 'ng-packagr', 'typescript', '--depth=0'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.restore) {
    restore(args.install);
    return;
  }
  if (process.env.CI !== 'true' && !args.force) {
    throw new Error(
      `toolchain-overlay: rewrites ${OVERLAID_FILES.join(', ')} and node_modules for a throwaway run; ` +
        `pass --force outside CI. ${RESTORE_HINT}`,
    );
  }
  const dirty = dirtyFiles();
  if (dirty && !args.dryRun) {
    throw new Error(`toolchain-overlay: the working tree is dirty, run it on a clean checkout:\n${dirty}`);
  }
  try {
    overlay(args);
  } catch (error) {
    if (!args.dryRun) {
      console.error(RESTORE_HINT);
    }
    throw error;
  }
  if (!args.dryRun) {
    console.log(`\nThe checkout now runs a different Angular. ${RESTORE_HINT}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
