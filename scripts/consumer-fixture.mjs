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
//   node scripts/consumer-fixture.mjs --angular 21 --variant schematics
//   node scripts/consumer-fixture.mjs --angular 21 --variant schematics --stale-core previous
//
// Variants:
//   full        zoneless app with Material, floating-ui and ngrx installed
//   zone        zone.js app, same installs
//   ssr         zoneless app with SSR and hydration (the build prerenders)
//   minimal     no optional peers installed: the build must not need them
//   schematics  a real `ng add` and `ng update` against the tarballs: two
//               ng add runs (the second changes nothing), ng add of a package
//               shim (which keeps every lib the first run recorded), two ng
//               update runs (the second finds nothing), then the
//               onboarded app builds and loads. `--stale-core <tgz | previous>`
//               adds a second sandbox where an older core is installed and
//               `ng add @cngx/forms` must replace it in the same run;
//               `previous` packs the newest registry release below the
//               tarballs.
//
// The schematics variant serves the tarballs from a local registry for the
// @cngx scope (other @cngx packages are proxied to the public registry), so
// the exact pins `ng add` writes install the packed release, not a published
// one of the same version.

import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const VARIANTS = ['full', 'zone', 'ssr', 'minimal', 'schematics'];
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
  const lean = variant === 'minimal' || variant === 'schematics';
  return {
    variant,
    zoneless: variant !== 'zone',
    ssr: variant === 'ssr',
    optionalPeers: !lean,
    smoke: variant !== 'ssr',
    schematics: variant === 'schematics',
  };
}

export function usageText() {
  return [
    'Usage: node scripts/consumer-fixture.mjs --angular <21 | 22 | 21.2.0> [--variant <variant>]',
    `       [--ignore-peers] [--stale-core <tgz | previous>] [--tarballs <dir>] [--work <dir>]`,
    `Variants: ${VARIANTS.join(', ')}`,
  ].join('\n');
}

// The flags every non-interactive cngx `ng add` in the fixture passes; the
// version makes the CLI skip its own install, because the tarball already
// placed the package.
const NG_ADD_FLAGS = ['--skip-confirmation', '--no-prompts', '--yes', '--lint=false'];

// Every lib the first `ng add @cngx/core` records; a later `--libs` answer
// adds to that floor and never shrinks it.
const ALL_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];

/** The libs of `expected` that `.cngx/install.json` does not record for `project`. */
export function missingRecordedLibs(installManifest, project, expected) {
  const recorded = installManifest.projects?.[project]?.answers?.libs ?? [];
  return expected.filter((lib) => !recorded.includes(lib));
}

/**
 * The real-CLI steps of the schematics variant, in order. `expect` is text
 * the step's output must contain; `clean` asks for an empty
 * `git status --porcelain` after it; `commit` records the tree after it.
 */
export function schematicsSteps(version) {
  return [
    { label: 'ng add @cngx/core', args: ['ng', 'add', `@cngx/core@${version}`, ...NG_ADD_FLAGS], commit: true },
    {
      label: 'ng add @cngx/core again',
      args: ['ng', 'add', `@cngx/core@${version}`, ...NG_ADD_FLAGS],
      expect: 'cngx is already set up; nothing changed.',
      clean: true,
    },
    {
      label: 'ng add @cngx/forms',
      args: ['ng', 'add', `@cngx/forms@${version}`, ...NG_ADD_FLAGS, '--libs', 'core'],
      pins: ['utils', 'core', 'common', 'forms'],
      recordedLibs: ALL_LIBS,
      commit: true,
    },
    {
      label: 'ng update @cngx/core',
      args: ['ng', 'update', '@cngx/core', '--migrate-only', '--from', '0.0.1', '--to', version, '--allow-dirty'],
      commit: true,
    },
    {
      label: 'ng update @cngx/core again',
      args: ['ng', 'update', '@cngx/core', '--migrate-only', '--from', '0.0.1', '--to', version, '--allow-dirty'],
      expect: 'found nothing to change',
      clean: true,
    },
  ];
}

/** The registry document npm reads for one package served from a tarball. */
export function packument(manifest, tarballUrl, tarball) {
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`;
  const shasum = createHash('sha1').update(tarball).digest('hex');
  return {
    name: manifest.name,
    'dist-tags': { latest: manifest.version },
    versions: { [manifest.version]: { ...manifest, dist: { tarball: tarballUrl, integrity, shasum } } },
  };
}

/** The newest version `npm view <name>@"<current" version --json` listed; npm prints one version bare. */
export function newestListed(output) {
  const parsed = output.trim() === '' ? [] : JSON.parse(output);
  const versions = Array.isArray(parsed) ? parsed : [parsed];
  return versions.at(-1);
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
    staleCore: null,
    work: join(tmpdir(), 'cngx-consumer-compat'),
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--angular': args.angular = argv[++i]; break;
      case '--variant': args.variant = argv[++i]; break;
      case '--tarballs': args.tarballs = resolve(argv[++i]); break;
      case '--ignore-peers': args.ignorePeers = true; break;
      case '--work': args.work = resolve(argv[++i]); break;
      case '--stale-core': args.staleCore = argv[++i]; break;
      default:
        console.error(`Unknown argument: ${argv[i]}\n${usageText()}`);
        process.exit(1);
    }
  }
  if (!args.angular) {
    console.error(usageText());
    process.exit(1);
  }
  if (args.staleCore !== null && args.variant !== 'schematics') {
    console.error('--stale-core needs --variant schematics');
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

async function smoke(appDir, plan) {
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
    // The onboarded app keeps the root component `ng new` wrote.
    if (plan.schematics) {
      await page.waitForSelector('app-root', { timeout: 15_000 });
    } else {
      await page.waitForSelector(`#${MARKER}`, { timeout: 15_000 });
      const text = await page.textContent(`#${MARKER}`);
      if (!text?.includes('10')) {
        errors.push(`probe text unexpected: "${text}"`);
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
  return errors;
}

// Runs a command without blocking the event loop, so the local registry in
// this process can answer the npm calls the command makes; echoes and returns
// the output.
function runAsync(cmd, args, options = {}) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  return new Promise((done, fail) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let output = '';
    const tee = (target) => (chunk) => {
      output += chunk;
      target.write(chunk);
    };
    child.stdout.on('data', tee(process.stdout));
    child.stderr.on('data', tee(process.stderr));
    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) {
        done(output);
      } else {
        fail(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

function tarballManifest(file) {
  return JSON.parse(capture('tar', ['-xzOf', file, 'package/package.json']));
}

/**
 * Serves every tarball as the only release of its package on 127.0.0.1;
 * other @cngx packages are proxied to the public registry. Resolves to the
 * registry URL and a close function.
 */
async function startLocalRegistry(tarballFiles) {
  const served = new Map();
  for (const file of tarballFiles) {
    const manifest = tarballManifest(file);
    served.set(manifest.name, { manifest, file, tarball: readFileSync(file) });
  }
  let base = '';
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent((request.url ?? '/').split('?')[0]).replace(/^\//, '');
    const tarballOf = [...served.values()].find((entry) => path === `-/${entry.manifest.name}.tgz`);
    if (tarballOf) {
      response.writeHead(200, { 'content-type': 'application/octet-stream' });
      response.end(tarballOf.tarball);
      return;
    }
    const entry = served.get(path);
    if (entry) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(packument(entry.manifest, `${base}-/${entry.manifest.name}.tgz`, entry.tarball)));
      return;
    }
    try {
      const upstream = await fetch(`https://registry.npmjs.org/${path.replace('/', '%2f')}`);
      response.writeHead(upstream.status, { 'content-type': 'application/json' });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      response.writeHead(502);
      response.end(String(error));
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}/`;
  return { url: base, close: () => new Promise((done) => server.close(done)) };
}

function git(appDir, args) {
  return capture('git', ['-c', 'user.email=fixture@cngx.invalid', '-c', 'user.name=fixture', ...args], { cwd: appDir });
}

function commitAll(appDir, message) {
  git(appDir, ['add', '-A']);
  git(appDir, ['commit', '-q', '--allow-empty', '-m', message]);
}

// The scope routes every @cngx install to the local registry; the rest of npm
// stays on the default registry.
function useLocalRegistry(appDir, registryUrl) {
  writeFileSync(join(appDir, '.npmrc'), `@cngx:registry=${registryUrl}\n`);
}

async function runSchematicsSteps(appDir, version) {
  git(appDir, ['init', '-q']);
  commitAll(appDir, 'fixture');
  for (const step of schematicsSteps(version)) {
    console.log(`\n[schematics] ${step.label}`);
    const output = await runAsync('npx', step.args, { cwd: appDir });
    if (step.expect && !output.includes(step.expect)) {
      throw new Error(`${step.label}: expected "${step.expect}" in the output`);
    }
    if (step.clean) {
      const status = git(appDir, ['status', '--porcelain']).trim();
      if (status !== '') {
        throw new Error(`${step.label} changed files:\n${status}`);
      }
    }
    if (step.pins) {
      const { dependencies } = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8'));
      const wrong = step.pins.filter((lib) => dependencies[`@cngx/${lib}`] !== version);
      if (wrong.length > 0) {
        throw new Error(`${step.label}: ${wrong.map((lib) => `@cngx/${lib}@${dependencies[`@cngx/${lib}`]}`).join(', ')} is not pinned to ${version}`);
      }
    }
    if (step.recordedLibs) {
      const installManifest = JSON.parse(readFileSync(join(appDir, '.cngx', 'install.json'), 'utf8'));
      const missing = missingRecordedLibs(installManifest, 'fixture', step.recordedLibs);
      if (missing.length > 0) {
        throw new Error(`${step.label}: .cngx/install.json no longer records ${missing.join(', ')}`);
      }
    }
    if (step.commit) {
      commitAll(appDir, step.label);
    }
  }
}

// `previous` is the newest registry release of @cngx/core below the packed
// one; anything else is a tarball path.
function resolveStaleCore(spec, version, sandbox) {
  if (spec !== 'previous') {
    return resolve(spec);
  }
  const previous = newestListed(capture('npm', ['view', `@cngx/core@<${version}`, 'version', '--json']));
  if (previous === undefined) {
    throw new Error(`the registry lists no @cngx/core below ${version}`);
  }
  const [packed] = JSON.parse(capture('npm', ['pack', `@cngx/core@${previous}`, '--json', '--pack-destination', sandbox]));
  return join(sandbox, packed.filename);
}

/**
 * An app with an older core installed: `ng add @cngx/forms` must install
 * the packed core and run its ng-add in the same command, which records the
 * packed release for the project.
 */
async function runStaleCoreLeg({ cliSpec, work, tarballFiles, version, registryUrl, staleCore }) {
  const sandbox = mkdtempSync(join(work, 'stale-core-'));
  const appDir = join(sandbox, 'fixture');
  const staleTarball = resolveStaleCore(staleCore, version, sandbox);
  const stale = tarballManifest(staleTarball).version;
  console.log(`\nStale core leg: @cngx/core ${stale} installed, packed ${version}\nSandbox: ${sandbox}\n`);
  run('npx', ['-y', `@angular/cli@${cliSpec}`, 'new', 'fixture', '--defaults', '--skip-git', '--skip-install', '--style=css', '--routing=false', '--ssr=false', '--zoneless=true'], { cwd: sandbox });
  run('npm', ['install'], { cwd: appDir });
  const others = tarballFiles.filter((file) => tarballManifest(file).name !== '@cngx/core');
  // The older core peers on its own release of the other packages; the
  // stale state is what `ng add` repairs, so npm is told to accept it.
  run('npm', ['install', '--legacy-peer-deps', staleTarball, ...others], { cwd: appDir });
  useLocalRegistry(appDir, registryUrl);
  const output = await runAsync('npx', ['ng', 'add', `@cngx/forms@${version}`, ...NG_ADD_FLAGS], { cwd: appDir });
  const manifest = JSON.parse(readFileSync(join(appDir, '.cngx', 'install.json'), 'utf8'));
  const recorded = manifest.projects?.fixture?.cngxVersion;
  if (recorded !== version) {
    throw new Error(`stale core leg: .cngx/install.json records ${recorded}, expected ${version}`);
  }
  if (/run ng add again/i.test(output)) {
    throw new Error('stale core leg: the shim asked for a second ng add run');
  }
  console.log(`\nStale core leg: @cngx/core ${stale} replaced by ${version} in the same ng add`);
}

async function main() {
  const { angular, variant, tarballs, work, ignorePeers, staleCore } = parseArgs(process.argv.slice(2));
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

  let registry = null;
  let version = null;
  if (plan.schematics) {
    version = tarballManifest(tarballFiles.find((file) => tarballManifest(file).name === '@cngx/core')).version;
    registry = await startLocalRegistry(tarballFiles);
    useLocalRegistry(appDir, registry.url);
  }
  try {
    if (plan.schematics) {
      await runSchematicsSteps(appDir, version);
    } else {
      writeFileSync(join(appDir, 'src', 'app', 'app.ts'), renderAppSource(plan));
    }
    run('npx', ['ng', 'build'], { cwd: appDir });
    if (plan.schematics && staleCore !== null) {
      await runStaleCoreLeg({ cliSpec, work, tarballFiles, version, registryUrl: registry.url, staleCore });
    } else if (plan.schematics) {
      console.log('\nStale core leg: skipped (pass --stale-core <tgz | previous> to run it)');
    }
  } finally {
    await registry?.close();
  }

  if (plan.smoke) {
    const errors = await smoke(appDir, plan);
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
