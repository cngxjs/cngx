#!/usr/bin/env node
// Moves a disposable checkout of this workspace onto another Angular release,
// so the libs can be built and unit tested there with the same sources. The
// repo itself keeps building and publishing with the toolchain in
// package.json; this script is for compatibility runs only (the angular-libs
// CI job and local probes).
//
// It rewrites the root package.json (the Angular packages, the devkit, the CLI
// schematics, angular-eslint, ng-packagr, @ngrx/signals,
// playwright-ng-schematics and TypeScript, the latter within the range the
// target @angular/compiler-cli peers on), lets an installed TypeScript 6
// accept the deprecated `baseUrl` in tsconfig.base.json, and runs the install.
// It needs no installed node_modules, so CI runs it instead of `npm ci`.
//
// Usage:
//   node scripts/toolchain-overlay.mjs --angular 22.2.3 [--force] [--no-install] [--dry-run]
//   node scripts/toolchain-overlay.mjs --angular 21.1.0 --framework-only --force
//   node scripts/toolchain-overlay.mjs --angular 22 --force    # newest 22, for a quick local look
//   node scripts/toolchain-overlay.mjs --restore [--discard-local-edits]
//
// An exact release is deterministic: every package that published that
// version is pinned to it, and every other package (tools on their own
// version line, TypeScript) is pinned to its newest release that was
// published no later than @angular/core at that version. A bare major takes
// the newest release of everything and moves with the registry.
// `--framework-only` moves only the framework (the @angular/* runtime and
// compiler packages and @ngrx/signals) and keeps the workspace's build
// tooling: older unit-test builders lack features the test setup relies on.
//
// Refuses to run outside CI (CI=true) unless --force is passed, and refuses on
// a dirty tree: the rewrite is not meant to be committed. It never restores a
// checkout on its own; it prints the command after every run. `--restore`
// puts back only the files the overlay wrote, and only while they are still
// as the overlay left them; a file edited since is kept and named, unless
// `--discard-local-edits` is passed.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The files the overlay may rewrite. */
export const OVERLAID_FILES = ['package.json', 'package-lock.json', 'tsconfig.base.json'];

/** Where the overlay records what it wrote; inside node_modules, so git never sees it and `npm ci` clears it. */
export const STATE_FILE = join('node_modules', '.cngx-toolchain-overlay.json');

/** How to put a developer checkout back after an overlay run. */
export const RESTORE_HINT =
  'Restore the checkout with: node scripts/toolchain-overlay.mjs --restore ' +
  `(checks out the overlaid ${OVERLAID_FILES.join(', ')} that are unchanged since, then runs npm ci)`;

/** Packages whose version line moves with Angular's major. */
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

/** Every dependency name in the manifest that the overlay moves, sorted. */
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
 * What `--angular` asks for: a major (`22`) or an exact release (`22.2.3`).
 * `range` is the npm range every package is listed in: its major.
 */
export function parseAngularTarget(spec) {
  if (/^\d+$/.test(spec ?? '')) {
    return { exact: undefined, range: spec };
  }
  const match = /^(\d+)\.\d+\.\d+$/.exec(spec ?? '');
  if (match) {
    return { exact: spec, range: match[1] };
  }
  throw new Error('toolchain-overlay: pass an exact release (--angular 22.2.3) or a major (--angular 22)');
}

/** Numeric order of two plain `x.y.z` versions. */
export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }
  return 0;
}

/**
 * The version to install from `versions` (what the registry lists in range)
 * and `times` (the registry's publish time per version): `exact` when it is
 * listed; else the newest stable version, published no later than `anchor`
 * when one is given. Throws when nothing qualifies.
 */
export function pickVersion({ name, versions, times = {}, exact, anchor }) {
  const stable = versions.filter((version) => /^\d+\.\d+\.\d+$/.test(version));
  if (exact && stable.includes(exact)) {
    return exact;
  }
  const eligible = anchor ? stable.filter((version) => times[version] !== undefined && times[version] <= anchor) : stable;
  if (eligible.length === 0) {
    throw new Error(`toolchain-overlay: ${name} has no stable release${anchor ? ` published by ${anchor}` : ''}`);
  }
  return [...eligible].sort(compareVersions).at(-1);
}

/**
 * The manifest with each target set to its resolved version: pinned when
 * `pin` is set or the old specifier was an exact pin, else `^version`.
 * `typescript` is set to `typescriptSpec`.
 */
export function overlayManifest(manifest, versions, typescriptSpec, pin = false) {
  const next = structuredClone(manifest);
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = next[field];
    if (!deps) {
      continue;
    }
    for (const name of Object.keys(deps)) {
      const version = versions[name];
      if (version) {
        deps[name] = pin || /^\d/.test(deps[name]) ? version : `^${version}`;
      }
    }
    if (typescriptSpec && deps['typescript']) {
      deps['typescript'] = typescriptSpec;
    }
  }
  return next;
}

/** The TypeScript range a compiler-cli peer names. */
export function typescriptRangeFromPeer(peerRange) {
  if (typeof peerRange !== 'string' || peerRange.trim() === '') {
    throw new Error('toolchain-overlay: @angular/compiler-cli names no typescript peer');
  }
  return peerRange.trim();
}

/** The major of an installed TypeScript version string, or undefined. */
export function typescriptMajorOf(version) {
  const match = /^(\d+)\./.exec(version ?? '');
  return match ? Number(match[1]) : undefined;
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

/** Content hash as the overlay state records it. */
export function hashOf(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * What `--restore` does with each file the overlay wrote: `restore` when the
 * file is still as the overlay left it, `edited` when it changed since.
 * `current` maps a path to its hash now, or undefined when it is gone.
 */
export function restorePlan(state, current) {
  const restore = [];
  const edited = [];
  for (const [path, hash] of Object.entries(state?.files ?? {})) {
    (current[path] === hash ? restore : edited).push(path);
  }
  return { restore, edited };
}

export function parseArgs(argv) {
  const args = {
    angular: undefined,
    force: false,
    install: true,
    dryRun: false,
    restore: false,
    discardLocalEdits: false,
    frameworkOnly: false,
  };
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
    } else if (arg === '--discard-local-edits') {
      args.discardLocalEdits = true;
    } else if (arg === '--framework-only') {
      args.frameworkOnly = true;
    } else {
      throw new Error(`toolchain-overlay: unknown argument ${arg}`);
    }
  }
  if (args.discardLocalEdits && !args.restore) {
    throw new Error('toolchain-overlay: --discard-local-edits only goes with --restore');
  }
  if (args.restore) {
    return { ...args, target: undefined };
  }
  return { ...args, target: parseAngularTarget(args.angular) };
}

function npmView(spec, field) {
  const out = execFileSync('npm', ['view', spec, field, '--json'], { encoding: 'utf8' }).trim();
  return out ? JSON.parse(out) : undefined;
}

function listVersions(name, range) {
  const listed = npmView(`${name}@${range}`, 'version');
  return (Array.isArray(listed) ? listed : [listed]).filter((version) => typeof version === 'string');
}

function resolveVersion(name, range, { exact, anchor }) {
  const versions = listVersions(name, range);
  const times = anchor ? (npmView(name, 'time') ?? {}) : {};
  return pickVersion({ name, versions, times, exact, anchor });
}

function dirtyFiles() {
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

function readText(path) {
  try {
    return readFileSync(join(ROOT, path), 'utf8');
  } catch {
    return undefined;
  }
}

function installedTypescriptVersion() {
  try {
    return JSON.parse(readText(join('node_modules', 'typescript', 'package.json')) ?? '').version;
  } catch {
    return undefined;
  }
}

// Records the hash of every file the overlay wrote so far; `--restore` only
// touches files that still match.
function recordState(written) {
  const files = {};
  for (const path of written) {
    const text = readText(path);
    if (text !== undefined) {
      files[path] = hashOf(text);
    }
  }
  mkdirSync(join(ROOT, 'node_modules'), { recursive: true });
  writeFileSync(join(ROOT, STATE_FILE), `${JSON.stringify({ files }, null, 2)}\n`);
}

function restore(args) {
  const raw = readText(STATE_FILE);
  if (raw === undefined) {
    throw new Error(
      `toolchain-overlay: no overlay state at ${STATE_FILE}, nothing restored. ` +
        `Check out ${OVERLAID_FILES.join(', ')} yourself if an overlay ran here.`,
    );
  }
  const state = JSON.parse(raw);
  const current = Object.fromEntries(
    Object.keys(state.files ?? {}).map((path) => {
      const text = readText(path);
      return [path, text === undefined ? undefined : hashOf(text)];
    }),
  );
  const { restore: clean, edited } = restorePlan(state, current);
  if (edited.length > 0 && !args.discardLocalEdits) {
    throw new Error(
      `toolchain-overlay: ${edited.join(', ')} changed after the overlay wrote it; nothing restored. ` +
        'Commit or move those edits, or pass --discard-local-edits to drop them.',
    );
  }
  const paths = [...clean, ...edited];
  if (paths.length > 0) {
    execFileSync('git', ['checkout', '--', ...paths], { cwd: ROOT, stdio: 'inherit' });
  }
  if (args.install) {
    execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit' });
  } else {
    rmSync(join(ROOT, STATE_FILE), { force: true });
  }
  console.log(`Restored ${paths.join(', ') || 'nothing'}${args.install ? ' and node_modules' : ''}.`);
}

function overlay(args, written) {
  const manifestPath = join(ROOT, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const { exact, range } = args.target;
  const anchor = exact ? npmView('@angular/core', 'time')?.[exact] : undefined;
  if (exact && anchor === undefined) {
    throw new Error(`toolchain-overlay: @angular/core ${exact} is not published`);
  }
  const versions = {};
  for (const name of overlayTargets(manifest, args.frameworkOnly)) {
    versions[name] = resolveVersion(name, range, { exact, anchor });
  }
  const compilerCli = versions['@angular/compiler-cli'];
  const tsRange = typescriptRangeFromPeer(npmView(`@angular/compiler-cli@${compilerCli}`, 'peerDependencies.typescript'));
  const typescript = exact ? resolveVersion('typescript', tsRange, { anchor }) : tsRange;

  for (const [name, version] of Object.entries(versions)) {
    console.log(`  ${name} -> ${version}`);
  }
  console.log(`  typescript -> ${typescript}${exact ? ` (newest of ${tsRange} by ${anchor})` : ''}`);
  if (args.dryRun) {
    return;
  }

  writeFileSync(manifestPath, `${JSON.stringify(overlayManifest(manifest, versions, typescript, exact !== undefined), null, 2)}\n`);
  written.add('package.json');
  if (!args.install) {
    console.log('  --no-install: tsconfig.base.json is left alone; the installed TypeScript decides it on the install run.');
    return;
  }
  written.add('package-lock.json');
  // The repo's own peers name its own Angular line, and tools like
  // typescript-eslint lag a TypeScript major.
  execFileSync('npm', ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  const installed = installedTypescriptVersion();
  if ((typescriptMajorOf(installed) ?? 0) >= 6) {
    const tsconfigPath = join(ROOT, 'tsconfig.base.json');
    writeFileSync(tsconfigPath, patchTsconfigForTs6(readFileSync(tsconfigPath, 'utf8')));
    written.add('tsconfig.base.json');
    console.log(`  TypeScript ${installed}: tsconfig.base.json accepts the deprecated baseUrl (ignoreDeprecations 6.0)`);
  }
  execFileSync('npm', ['ls', '@angular/core', '@angular/build', 'ng-packagr', 'typescript', '--depth=0'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.restore) {
    restore(args);
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
  const written = new Set();
  try {
    overlay(args, written);
  } finally {
    if (written.size > 0) {
      recordState(written);
      console.log(`\nThe checkout no longer runs the committed toolchain. ${RESTORE_HINT}`);
    }
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
