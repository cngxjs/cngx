#!/usr/bin/env node
// Moves a disposable checkout of this workspace onto another Angular major,
// so the libs can be built and unit tested there with the same sources. The
// repo itself keeps building and publishing with the toolchain in
// package.json; this script is for compatibility runs only (the
// angular-22-libs CI job and local probes).
//
// It rewrites the root package.json (every Angular package, the devkit, the
// CLI schematics, angular-eslint, ng-packagr, @ngrx/signals,
// playwright-ng-schematics and TypeScript, the latter to the range the target
// @angular/compiler-cli peers on), lets TypeScript 6 accept the deprecated
// `baseUrl` in tsconfig.base.json, and runs the install.
//
// Usage:
//   node scripts/toolchain-overlay.mjs --angular 22 [--force] [--no-install] [--dry-run]
//
// Refuses to run outside CI (CI=true) unless --force is passed, and refuses on
// a dirty tree: the rewrite is not meant to be committed.

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

/** Every dependency name in the manifest that the overlay moves, sorted. */
export function overlayTargets(manifest) {
  const names = new Set();
  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (followsAngularMajor(name)) {
        names.add(name);
      }
    }
  }
  return [...names].sort();
}

/**
 * The manifest with each target set to its resolved version. An exact pin
 * stays exact, any other range becomes `^version`. `typescript` is set to the
 * range given as `typescriptRange`.
 */
export function overlayManifest(manifest, versions, typescriptRange) {
  const next = structuredClone(manifest);
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = next[field];
    if (!deps) {
      continue;
    }
    for (const name of Object.keys(deps)) {
      const version = versions[name];
      if (version) {
        deps[name] = /^\d/.test(deps[name]) ? version : `^${version}`;
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

/** The lowest TypeScript major a range names, or undefined when it names none. */
export function typescriptMajor(range) {
  const match = /(\d+)\./.exec(range);
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

function parseArgs(argv) {
  const args = { angular: undefined, force: false, install: true, dryRun: false };
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
    } else {
      throw new Error(`toolchain-overlay: unknown argument ${arg}`);
    }
  }
  if (!args.angular || !/^\d+$/.test(args.angular)) {
    throw new Error('toolchain-overlay: pass the target Angular major, e.g. --angular 22');
  }
  return args;
}

function npmView(spec, field) {
  const out = execFileSync('npm', ['view', spec, field, '--json'], { encoding: 'utf8' }).trim();
  return out ? JSON.parse(out) : undefined;
}

/** Highest published version within one major, ignoring prereleases. */
function latestInMajor(name, major) {
  const result = npmView(`${name}@${major}`, 'version');
  const list = Array.isArray(result) ? result : [result];
  const stable = list.filter((v) => typeof v === 'string' && !v.includes('-'));
  if (stable.length === 0) {
    throw new Error(`toolchain-overlay: ${name} has no stable ${major}.x release`);
  }
  return stable[stable.length - 1];
}

function dirtyFiles() {
  return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (process.env.CI !== 'true' && !args.force) {
    throw new Error('toolchain-overlay: rewrites package.json for a throwaway run; pass --force outside CI');
  }
  const dirty = dirtyFiles();
  if (dirty && !args.dryRun) {
    throw new Error(`toolchain-overlay: the working tree is dirty, run it on a clean checkout:\n${dirty}`);
  }

  const manifestPath = join(ROOT, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const versions = {};
  for (const name of overlayTargets(manifest)) {
    versions[name] = latestInMajor(name, args.angular);
  }
  const compilerCli = versions['@angular/compiler-cli'];
  const tsRange = typescriptRangeFromPeer(npmView(`@angular/compiler-cli@${compilerCli}`, 'peerDependencies.typescript'));

  for (const [name, version] of Object.entries(versions)) {
    console.log(`  ${name} -> ${version}`);
  }
  console.log(`  typescript -> ${tsRange}`);
  if (args.dryRun) {
    return;
  }

  writeFileSync(manifestPath, `${JSON.stringify(overlayManifest(manifest, versions, tsRange), null, 2)}\n`);
  if ((typescriptMajor(tsRange) ?? 0) >= 6) {
    const tsconfigPath = join(ROOT, 'tsconfig.base.json');
    writeFileSync(tsconfigPath, patchTsconfigForTs6(readFileSync(tsconfigPath, 'utf8')));
  }
  if (args.install) {
    // The repo's own peers still name the old major until the overlay is
    // promoted, and tools like typescript-eslint lag a TypeScript major.
    execFileSync('npm', ['install', '--legacy-peer-deps', '--ignore-scripts', '--no-audit', '--no-fund'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    execFileSync('npm', ['ls', '@angular/core', '@angular/build', 'ng-packagr', 'typescript', '--depth=0'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
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
