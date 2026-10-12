#!/usr/bin/env node
// Consumer fixture: proves the packed libs install and build in a fresh
// Angular app of a given version, the way a real consumer would use them.
//
// Steps: `ng new` at the requested Angular version, install the tarballs from
// scripts/pack-libs.mjs with plain `npm install` (no --legacy-peer-deps, so a
// wrong peer range surfaces as ERESOLVE), assert a single @angular/core in the
// tree, build a page that touches every lib in production mode, then load the
// build in Chromium and fail on console errors.
//
// Usage:
//   npm run build:libs && npm run pack:libs
//   node scripts/consumer-fixture.mjs --angular 21            # newest 21.x
//   node scripts/consumer-fixture.mjs --angular 21.2.0        # exact: the lowest the peer range allows
//   node scripts/consumer-fixture.mjs --angular 22 --variant ssr
//   node scripts/consumer-fixture.mjs --angular 21 --variant minimal
//   node scripts/consumer-fixture.mjs --angular 22 --ignore-peers   # does the code run beyond the declared range?
//
// Variants:
//   full      zoneless app with Material, floating-ui and ngrx installed
//   zone      zone.js app, same installs
//   ssr       zoneless app with SSR and hydration (the build prerenders)
//   minimal   no optional peers installed: the build must not need them

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const VARIANTS = ['full', 'zone', 'ssr', 'minimal'];
const MARKER = 'cngx-consumer-ok';

/** `21` / `22.1` are ranges for `ng new`; `21.2.0` is an exact pin. */
export function parseAngularSpec(spec) {
  if (!/^\d+(\.\d+){0,2}$/.test(spec)) {
    throw new Error(`Unsupported --angular "${spec}": use 21, 21.2 or 21.2.0`);
  }
  return { cliSpec: spec, exact: spec.split('.').length === 3 };
}

export function variantPlan(variant) {
  if (!VARIANTS.includes(variant)) {
    throw new Error(`Unknown variant "${variant}". Available: ${VARIANTS.join(', ')}`);
  }
  const minimal = variant === 'minimal';
  return {
    variant,
    zoneless: variant !== 'zone',
    ssr: variant === 'ssr',
    optionalPeers: !minimal,
    smoke: variant !== 'ssr',
  };
}

const ANGULAR_SCOPES = ['@angular/', '@angular-devkit/', '@schematics/'];

/** Pins every Angular package of a generated app to `version`, for the lowest-version row. */
export function pinAngularDeps(pkg, version) {
  const pinned = { ...pkg };
  for (const field of ['dependencies', 'devDependencies']) {
    pinned[field] = Object.fromEntries(
      Object.entries(pkg[field] ?? {}).map(([name, range]) => [
        name,
        ANGULAR_SCOPES.some((scope) => name.startsWith(scope)) ? version : range,
      ]),
    );
  }
  return pinned;
}

/**
 * The package specs `npm install` gets next to the tarballs. cdk and Material
 * patch numbers drift from core's, so only an exact pin names a version; the
 * rest follows the installed major.
 */
export function peerInstallSpecs(plan, angularVersion, exactPin = null) {
  const major = angularVersion.split('.')[0];
  const range = exactPin ?? `^${major}.0.0`;
  const specs = [`@angular/cdk@${range}`];
  if (plan.optionalPeers) {
    specs.push(`@angular/material@${range}`, '@floating-ui/dom@^1', `@ngrx/signals@^${major}`);
  }
  return specs;
}

/** The root component: one probe per lib, optional-peer imports only when the plan installed them. */
export function renderAppSource(plan) {
  const full = plan.optionalPeers;
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CngxLiveRegion } from '@cngx/common/a11y';
import { WINDOW } from '@cngx/core/tokens';
import { CngxTreetable } from '@cngx/data-display/treetable';
import { requiredTrue } from '@cngx/forms/validators';
import { fromQuery } from '@cngx/interop/query';
${full ? "import { withCngxAsyncState } from '@cngx/interop/signals';\n" : ''}import { CngxEmptyState } from '@cngx/ui/empty-state';
import { clamp } from '@cngx/utils';

const probes: readonly unknown[] = [clamp, WINDOW, requiredTrue, CngxTreetable, fromQuery${
    full ? ', withCngxAsyncState' : ''
  }];

@Component({
  selector: 'app-root',
  imports: [CngxEmptyState, CngxLiveRegion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <p id="${MARKER}" cngxLiveRegion>${MARKER} {{ probeCount }} {{ clamped }}</p>
    <cngx-empty-state title="Nothing here" />
  \`,
})
export class App {
  protected readonly probeCount = probes.length;
  protected readonly clamped = clamp(15, 0, 10);
}
`;
}

function run(cmd, args, options = {}) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  return execFileSync(cmd, args, { stdio: 'inherit', ...options });
}

function capture(cmd, args, options = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options });
}

function parseArgs(argv) {
  const args = {
    angular: null,
    variant: 'full',
    tarballs: join(ROOT, '.consumer-compat', 'tarballs'),
    // Outside the repo: the Angular CLI refuses `ng new` inside a workspace.
    ignorePeers: false,
    work: join(tmpdir(), 'cngx-consumer-compat'),
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--angular': args.angular = argv[++i]; break;
      case '--variant': args.variant = argv[++i]; break;
      case '--tarballs': args.tarballs = resolve(argv[++i]); break;
      case '--ignore-peers': args.ignorePeers = true; break;
      case '--work': args.work = resolve(argv[++i]); break;
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        process.exit(1);
    }
  }
  if (!args.angular) {
    console.error('Specify --angular <21 | 22 | 21.2.0>');
    process.exit(1);
  }
  return args;
}

function angularVersionsInTree(appDir) {
  // npm ls exits non-zero for an invalid peer; the JSON is still on stdout.
  let raw;
  try {
    raw = capture('npm', ['ls', '@angular/core', '--all', '--json'], { cwd: appDir });
  } catch (error) {
    raw = error.stdout;
  }
  const versions = new Set();
  const visit = (node) => {
    for (const [name, child] of Object.entries(node.dependencies ?? {})) {
      if (name === '@angular/core') {
        versions.add(child.version);
      }
      visit(child);
    }
  };
  visit(JSON.parse(raw));
  return [...versions];
}

async function smoke(appDir) {
  const { chromium } = await import('@playwright/test');
  const webRoot = join(appDir, 'dist', 'fixture', 'browser');
  const port = 4300 + Math.floor(Math.random() * 500);
  const server = spawn(join(ROOT, 'node_modules', '.bin', 'http-server'), [webRoot, '-p', String(port), '-s'], {
    stdio: 'ignore',
  });
  const errors = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(error.message));
    await new Promise((done) => setTimeout(done, 800));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector(`#${MARKER}`, { timeout: 15_000 });
    const text = await page.textContent(`#${MARKER}`);
    if (!text?.includes('10')) {
      errors.push(`probe text unexpected: "${text}"`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
  return errors;
}

async function main() {
  const { angular, variant, tarballs, work, ignorePeers } = parseArgs(process.argv.slice(2));
  const { cliSpec, exact } = parseAngularSpec(angular);
  const plan = variantPlan(variant);

  const tarballFiles = existsSync(tarballs)
    ? readdirSync(tarballs).filter((file) => file.endsWith('.tgz')).map((file) => join(tarballs, file))
    : [];
  if (tarballFiles.length === 0) {
    console.error(`No tarballs in ${tarballs}: run "npm run build:libs && npm run pack:libs" first.`);
    process.exit(1);
  }

  mkdirSync(work, { recursive: true });
  const sandbox = mkdtempSync(join(work, `angular-${angular}-${variant}-`));
  const appDir = join(sandbox, 'fixture');
  console.log(`\nFixture: Angular ${angular}, variant ${variant}\nSandbox: ${sandbox}\n`);

  const newArgs = [
    '-y', `@angular/cli@${cliSpec}`, 'new', 'fixture', '--defaults', '--skip-git', '--skip-install',
    '--style=css', '--routing=false', `--ssr=${plan.ssr}`, `--zoneless=${plan.zoneless}`,
  ];
  run('npx', newArgs, { cwd: sandbox });

  const manifestPath = join(appDir, 'package.json');
  if (exact) {
    const pinned = pinAngularDeps(JSON.parse(readFileSync(manifestPath, 'utf8')), angular);
    writeFileSync(manifestPath, JSON.stringify(pinned, null, 2) + '\n');
  }

  run('npm', ['install'], { cwd: appDir });
  const installedAngular = JSON.parse(readFileSync(join(appDir, 'node_modules/@angular/core/package.json'), 'utf8')).version;
  console.log(`\nInstalled @angular/core ${installedAngular}`);

  // Peers first: npm resolves a peer requested in the same command as a file
  // tarball to "undefined" and reports a false ERESOLVE.
  run('npm', ['install', ...peerInstallSpecs(plan, installedAngular, exact ? angular : null)], { cwd: appDir });
  if (ignorePeers) {
    console.log('\nNOT a consumer-realistic row: --ignore-peers installs with --legacy-peer-deps to test code compatibility beyond the declared peer range.');
  }
  run('npm', ['install', ...(ignorePeers ? ['--legacy-peer-deps'] : []), ...tarballFiles], { cwd: appDir });

  const versions = angularVersionsInTree(appDir);
  if (versions.length !== 1) {
    throw new Error(`Expected one @angular/core in the tree, found ${versions.join(', ')}`);
  }

  writeFileSync(join(appDir, 'src', 'app', 'app.ts'), renderAppSource(plan));
  run('npx', ['ng', 'build'], { cwd: appDir });

  if (plan.smoke) {
    const errors = await smoke(appDir);
    if (errors.length > 0) {
      throw new Error(`Browser smoke failed:\n  ${errors.join('\n  ')}`);
    }
    console.log('\nBrowser smoke: clean');
  }
  console.log(`\nOK: Angular ${installedAngular}, variant ${variant}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\nFAILED: ${error.message}`);
    process.exit(1);
  });
}
