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
//   node scripts/consumer-fixture.mjs --angular 21.1.0        # exact: the lowest the peer range allows
//   node scripts/consumer-fixture.mjs --angular 22 --variant ssr
//   node scripts/consumer-fixture.mjs --angular 21 --variant minimal
//   node scripts/consumer-fixture.mjs --angular 22 --ignore-peers   # does the code run beyond the declared range?
//   node scripts/consumer-fixture.mjs --angular 21 --variant schematics
//   node scripts/consumer-fixture.mjs --angular 21 --variant schematics --stale-core previous
//   node scripts/consumer-fixture.mjs --angular 21 --variant schematics --preset full
//
// Variants:
//   full        zoneless app with Material, floating-ui and ngrx installed
//   zone        zone.js app, same installs
//   ssr         zoneless app with SSR and hydration (the build prerenders)
//   minimal     no optional peers installed: the build must not need them
//   onboarding  the documented path on a fresh app with nothing installed:
//               one `ng add @cngx/core` through the local registry, then the
//               CDK it installed must be on the app's Angular major (npm
//               would otherwise fetch the newest CDK the peers allow); a
//               second `ng add` changes nothing; the app builds and loads.
//               Takes --preset like schematics. --add ui runs the shim
//               `ng add @cngx/ui` instead, after installing @angular/cdk on
//               the app's major as the docs ask (without it the CLI's
//               pre-install of @cngx/ui on Angular 21 fetches CDK 22 and
//               stops with ERESOLVE).
//   ngmodule    onboarding on an `ng new --standalone=false` app with
//               routing: the outlets go into the root NgModule and the stock
//               spec, no starter is written; with --preset full `ng test`
//               runs and both outlets must be in the DOM.
//   schematics  a real `ng add` and `ng update` against the tarballs: two
//               ng add runs (the second changes nothing), ng add of a package
//               shim (which keeps every lib the first run recorded), two ng
//               update runs (the second finds nothing), then the
//               onboarded app builds and loads. `--stale-core <tgz | previous>`
//               adds a second sandbox where an older core is installed and
//               `ng add @cngx/forms` must replace it in the same run;
//               `previous` packs the newest registry release below the
//               tarballs. `--preset <name>` picks the ng add preset
//               (default `recommended`); `full` also runs `ng test` on the
//               onboarded app, checks both feedback outlets in the DOM and
//               clicks the starter's toast and banner buttons. With
//               --stale-core a third sandbox installs utils, core, common and
//               forms at the stale release (`previous` only) and runs a real
//               `ng update @cngx/core` (no --migrate-only): the CLI must move
//               the whole package group to the packed release and run its
//               migration. Every schematics run also has two terminal legs
//               on copies of the fresh app, under a pseudo-terminal (python3's
//               pty module): a plain `ng add @cngx/core` whose preset, libs,
//               language, feedback and editor questions are answered by key
//               presses, and the same command under CI=true, which must ask
//               nothing and take the defaults.
//
// The schematics variant serves the tarballs from a local registry for the
// @cngx scope (other @cngx packages are proxied to the public registry), so
// the exact pins `ng add` writes install the packed release, not a published
// one of the same version.

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const VARIANTS = ['full', 'zone', 'ssr', 'minimal', 'schematics', 'onboarding', 'ngmodule'];
const MARKER = 'cngx-consumer-ok';

/** The ng add presets the schematics variant can run; `recommended` is what ng add picks without one. */
export const PRESETS = ['minimal', 'recommended', 'full'];
const DEFAULT_PRESET = 'recommended';

/** `21` / `22.1` are ranges for `ng new`; `21.1.0` is an exact pin. */
export function parseAngularSpec(spec) {
  if (!/^\d+(\.\d+){0,2}$/.test(spec)) {
    throw new Error(`Unsupported --angular "${spec}": use 21, 21.1 or 21.1.0`);
  }
  return { cliSpec: spec, exact: spec.split('.').length === 3 };
}

export function variantPlan(variant) {
  if (!VARIANTS.includes(variant)) {
    throw new Error(`Unknown variant "${variant}". Available: ${VARIANTS.join(', ')}`);
  }
  const ngModule = variant === 'ngmodule';
  const onboarding = variant === 'onboarding' || ngModule;
  const lean = variant === 'minimal' || variant === 'schematics' || onboarding;
  return {
    variant,
    // `ng new --standalone=false` with routing, the NgModule spec that
    // imports RouterModule in its own TestBed.
    standalone: !ngModule,
    routing: ngModule,
    zoneless: variant !== 'zone',
    ssr: variant === 'ssr',
    optionalPeers: !lean,
    smoke: variant !== 'ssr',
    schematics: variant === 'schematics' || onboarding,
    // A fresh app, nothing installed beforehand: `ng add @cngx/core` alone
    // must bring every package and the CDK at the app's own Angular major.
    onboarding,
    // `ng test` with the cngx Vitest matchers, against the Vitest major the
    // app's own CLI installs (4 on Angular 21, 5 on Angular 22).
    matcherSpec: variant === 'full',
  };
}

export function usageText() {
  return [
    'Usage: node scripts/consumer-fixture.mjs --angular <21 | 22 | 21.1.0> [--variant <variant>]',
    `       [--ignore-peers] [--stale-core <tgz | previous>] [--preset <${PRESETS.join(' | ')}>]`,
    `       [--add <${ONBOARDING_PACKAGES.join(' | ')}>] (onboarding only)`,
    '       [--tarballs <dir>] [--work <dir>]',
    `Variants: ${VARIANTS.join(', ')}`,
  ].join('\n');
}

/**
 * The cngx starter `--preset full` writes over the untouched `ng new` app:
 * the heading the stock spec asserts, a button per feedback surface and the
 * message it shows in its outlet, and the icon link.
 */
export const STARTER_SMOKE = {
  heading: 'Hello, fixture.',
  shows: [
    { button: 'Toast', outlet: 'cngx-toast-outlet', message: 'Saved. This toast came through the toast outlet.' },
    { button: 'Banner', outlet: 'cngx-banner-outlet', message: 'A banner stays until someone closes it.' },
  ],
  icon: 'favicon.svg',
};

/**
 * What the schematics variant checks beyond the build for a preset: only
 * `full` provides feedback and writes the starter, so only it runs `ng test`
 * over the stock spec, expects the outlets in the DOM and clicks the
 * starter's toast and banner buttons; the default path gets no extra step.
 * An NgModule app (`{ standalone: false }`) gets the outlets but no starter.
 */
export function presetPlan(preset = DEFAULT_PRESET, { standalone = true } = {}) {
  if (!PRESETS.includes(preset)) {
    throw new Error(`Unknown preset "${preset}". Available: ${PRESETS.join(', ')}`);
  }
  const full = preset === 'full';
  return {
    preset,
    ngTest: full,
    outlets: full ? ['cngx-banner-outlet', 'cngx-toast-outlet'] : [],
    starter: full && standalone ? STARTER_SMOKE : undefined,
    // The starter keeps its component stylesheet inside the `ng new` budgets.
    noBudgetWarnings: full,
  };
}

/** The budget warnings `ng build` printed in `output`, one line each. */
export function budgetWarnings(output) {
  return output.split(/\r?\n/).filter((line) => /exceeded maximum budget/.test(line));
}

// Runs a command, echoes its output and returns stdout and stderr together.
function runEchoed(cmd, args, options = {}) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${result.status ?? result.signal}`);
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

// The starter in the browser: its heading, each button's message in its
// outlet, and the icon link pointing at a favicon the server delivers.
async function smokeStarter(page, starter, errors) {
  const heading = (await page.textContent('h1'))?.trim();
  if (heading !== starter.heading) {
    errors.push(`expected the starter heading "${starter.heading}", found "${heading}"`);
  }
  for (const { button, outlet, message } of starter.shows) {
    await page.getByRole('button', { name: button, exact: true }).click();
    try {
      await page.locator(outlet).getByText(message).waitFor({ timeout: 5_000 });
    } catch {
      errors.push(`clicking "${button}" showed no "${message}" in <${outlet}>`);
    }
  }
  const icon = await page.getAttribute('link[rel="icon"]', 'href');
  const served = icon === null ? undefined : await page.request.get(new URL(icon, page.url()).href);
  if (icon !== starter.icon || served?.ok() !== true) {
    errors.push(`expected the icon link at a served ${starter.icon}, found ${icon ?? 'none'}`);
  }
}

// The default preset passes no flag, so the default path runs the exact
// command it always ran.
function presetFlags(preset) {
  return preset === DEFAULT_PRESET ? [] : ['--preset', preset];
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
export function schematicsSteps(version, preset = DEFAULT_PRESET) {
  const core = ['ng', 'add', `@cngx/core@${version}`, ...NG_ADD_FLAGS, ...presetFlags(preset)];
  return [
    { label: 'ng add @cngx/core', args: core, commit: true },
    {
      label: 'ng add @cngx/core again',
      args: core,
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

/**
 * What the browser smoke drives on the root component: the select shell with
 * its search, the combobox, and a Signal Forms number field with min/max
 * inside cngx-form-field. Ids and texts are shared with `renderAppSource`.
 */
export const INTERACTIVE_SMOKE = {
  shell: { name: 'City', searchPlaceholder: 'Filter cities', search: 'ber', option: 'Berlin', term: 'term:ber', value: 'city:Berlin' },
  combobox: { name: 'Frameworks', search: 'ang', option: 'Angular', picked: 'picked:angular' },
  seats: { name: 'Seats', tooMany: '20', error: 'At most 10 seats', fine: '5', valid: 'seats-valid:true' },
};

/**
 * The root component: one probe per lib, optional-peer imports only when the
 * plan installed them, plus the parts of @cngx/forms that depend most on the
 * Angular version (select shell and combobox models, a Signal Forms field
 * with min/max bound through cngx-form-field).
 */
export function renderAppSource(plan) {
  const full = plan.optionalPeers;
  return `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, max, min, schema } from '@angular/forms/signals';
import { CngxLiveRegion } from '@cngx/common/a11y';
import { WINDOW } from '@cngx/core/tokens';
import { CngxTreetable } from '@cngx/data-display/treetable';
import { CngxFieldErrors, CngxFormField, CngxLabel } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';
import {
  CngxCombobox,
  CngxSelectOption,
  CngxSelectSearch,
  CngxSelectShell,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';
import { requiredTrue } from '@cngx/forms/validators';
import { fromQuery } from '@cngx/interop/query';
${full ? "import { withCngxAsyncState } from '@cngx/interop/signals';\n" : ''}import { CngxEmptyState } from '@cngx/ui/empty-state';
import { clamp } from '@cngx/utils';

const probes: readonly unknown[] = [clamp, WINDOW, requiredTrue, CngxTreetable, fromQuery${
    full ? ', withCngxAsyncState' : ''
  }];

@Component({
  selector: 'app-root',
  imports: [
    CngxEmptyState,
    CngxLiveRegion,
    CngxSelectShell,
    CngxSelectOption,
    CngxSelectSearch,
    CngxCombobox,
    CngxFormField,
    CngxLabel,
    CngxInput,
    CngxFieldErrors,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <p id="${MARKER}" cngxLiveRegion>${MARKER} {{ probeCount }} {{ clamped }}</p>
    <cngx-empty-state title="Nothing here" />

    <cngx-select-shell [label]="'${INTERACTIVE_SMOKE.shell.name}'" [(value)]="city" [(searchTerm)]="term" placeholder="Pick a city">
      <cngx-select-search [placeholder]="'${INTERACTIVE_SMOKE.shell.searchPlaceholder}'" />
      @for (name of cities; track name) {
        <cngx-option [value]="name">{{ name }}</cngx-option>
      }
    </cngx-select-shell>
    <p id="fx-term">term:{{ term() }}</p>
    <p id="fx-city">city:{{ city() ?? '' }}</p>

    <cngx-combobox [label]="'${INTERACTIVE_SMOKE.combobox.name}'" [options]="frameworks" [(values)]="picked" placeholder="Search frameworks" />
    <p id="fx-picked">picked:{{ picked().join(',') }}</p>

    <cngx-form-field [field]="booking.seats">
      <label cngxLabel>${INTERACTIVE_SMOKE.seats.name}</label>
      <input cngxInput type="number" [formField]="booking.seats" />
      <cngx-field-errors />
    </cngx-form-field>
    <p id="fx-seats-valid">seats-valid:{{ booking.seats().valid() }}</p>
  \`,
})
export class App {
  protected readonly probeCount = probes.length;
  protected readonly clamped = clamp(15, 0, 10);

  protected readonly cities = ['Amsterdam', 'Berlin', 'Vienna', 'Zurich'];
  protected readonly city = signal<string | undefined>(undefined);
  protected readonly term = signal('');

  protected readonly frameworks: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ];
  protected readonly picked = signal<string[]>([]);

  private readonly model = signal({ seats: 2 });
  protected readonly booking = form(
    this.model,
    schema<{ seats: number }>((root) => {
      min(root.seats, 1, { message: 'At least 1 seat' });
      max(root.seats, 10, { message: '${INTERACTIVE_SMOKE.seats.error}' });
    }),
  );
}
`;
}

// Drives the forms parts of the root component and records what did not react.
async function smokeInteractive(page, errors) {
  const { shell, combobox, seats } = INTERACTIVE_SMOKE;
  const expectText = async (selector, text, what) => {
    try {
      await page.locator(selector).filter({ hasText: text }).waitFor({ timeout: 5_000 });
    } catch {
      errors.push(`${what}: expected "${text}" in ${selector}, found "${(await page.textContent(selector))?.trim()}"`);
    }
  };

  // Every control is found by its role and accessible name, so a missing or
  // wrong name fails the smoke instead of hiding behind a class selector.
  const byRole = async (role, name, what) => {
    const locator = page.getByRole(role, { name, exact: true });
    // A panel opens after the input event; wait for the first match before counting.
    await locator.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    const count = await locator.count();
    if (count !== 1) {
      errors.push(`${what}: expected one ${role} named "${name}", found ${count}`);
    }
    return locator.first();
  };

  await (await byRole('combobox', shell.name, 'select shell trigger')).click();
  await page.getByPlaceholder(shell.searchPlaceholder, { exact: true }).fill(shell.search);
  await expectText('#fx-term', shell.term, 'select shell search term');
  await (await byRole('option', shell.option, 'select shell option')).click();
  await expectText('#fx-city', shell.value, 'select shell value');

  await (await byRole('combobox', combobox.name, 'combobox input')).fill(combobox.search);
  await (await byRole('option', combobox.option, 'combobox option')).click();
  await expectText('#fx-picked', combobox.picked, 'combobox values');
  await page.keyboard.press('Escape');

  const input = await byRole('spinbutton', seats.name, 'seats input');
  await input.fill(seats.tooMany);
  await input.blur();
  await expectText('cngx-form-field', seats.error, 'max error through cngx-field-errors');
  if ((await input.getAttribute('aria-invalid')) !== 'true') {
    errors.push(`seats input: expected aria-invalid="true" at ${seats.tooMany}`);
  }
  await input.fill(seats.fine);
  await input.blur();
  await expectText('#fx-seats-valid', seats.valid, 'seats validity');
  if ((await input.getAttribute('aria-invalid')) === 'true') {
    errors.push(`seats input: still aria-invalid at ${seats.fine}`);
  }
}

/**
 * The unit spec the `full` variant writes over the stock app spec: it
 * registers the cngx announcement matchers from `@cngx/core/testing/vitest`
 * and asserts through them, so `ng test` proves the optional vitest peer
 * against the Vitest the app was generated with.
 */
export function renderMatcherSpec() {
  return `import { expect, it } from 'vitest';
import { createAnnouncementCapture } from '@cngx/core/testing';
import { cngxAnnouncementMatchers } from '@cngx/core/testing/vitest';

expect.extend(cngxAnnouncementMatchers);

it('hears a polite live region through the cngx matchers', async () => {
  const host = document.createElement('section');
  document.body.append(host);
  const capture = createAnnouncementCapture({ root: host });
  const region = document.createElement('div');
  region.setAttribute('aria-live', 'polite');
  host.append(region);
  region.textContent = 'Saved';
  await Promise.resolve();

  expect(capture).toHaveHeard('Saved');
  expect(capture).not.toHaveHeard('Upload failed');
  capture.stop();
});
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
    preset: null,
    add: null,
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
      case '--preset': args.preset = argv[++i]; break;
      case '--add': args.add = argv[++i]; break;
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
  if (args.preset !== null && !['schematics', 'onboarding', 'ngmodule'].includes(args.variant)) {
    console.error('--preset needs --variant schematics, onboarding or ngmodule');
    process.exit(1);
  }
  if (args.preset !== null && !PRESETS.includes(args.preset)) {
    console.error(`Unknown --preset "${args.preset}". Available: ${PRESETS.join(', ')}`);
    process.exit(1);
  }
  if (args.add !== null && args.variant !== 'onboarding') {
    console.error('--add needs --variant onboarding');
    process.exit(1);
  }
  if (args.add !== null && !ONBOARDING_PACKAGES.includes(args.add)) {
    console.error(`Unknown --add "${args.add}". Available: ${ONBOARDING_PACKAGES.join(', ')}`);
    process.exit(1);
  }
  return { ...args, preset: args.preset ?? DEFAULT_PRESET, add: args.add ?? 'core' };
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

async function smoke(appDir, plan, { outlets = [], starter } = {}) {
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
      // An outlet renders nothing until a toast or banner shows; it only has to be there.
      for (const outlet of outlets) {
        if ((await page.locator(outlet).count()) !== 1) {
          errors.push(`expected one <${outlet}> in the DOM`);
        }
      }
      if (starter !== undefined) {
        await smokeStarter(page, starter, errors);
      }
    } else {
      await page.waitForSelector(`#${MARKER}`, { timeout: 15_000 });
      const text = await page.textContent(`#${MARKER}`);
      if (!text?.includes('10')) {
        errors.push(`probe text unexpected: "${text}"`);
      }
      await smokeInteractive(page, errors);
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

// Runs `steps` in a fresh git repository of the app, checking each as
// `schematicsSteps` describes.
async function runSteps(appDir, version, steps, tag) {
  git(appDir, ['init', '-q']);
  commitAll(appDir, 'fixture');
  for (const step of steps) {
    console.log(`\n[${tag}] ${step.label}`);
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

// The newest registry release of @cngx/core below the packed one.
function previousRelease(version) {
  const previous = newestListed(capture('npm', ['view', `@cngx/core@<${version}`, 'version', '--json']));
  if (previous === undefined) {
    throw new Error(`the registry lists no @cngx/core below ${version}`);
  }
  return previous;
}

// `previous` is the newest registry release of @cngx/core below the packed
// one; anything else is a tarball path.
function resolveStaleCore(spec, version, sandbox) {
  if (spec !== 'previous') {
    return resolve(spec);
  }
  const previous = previousRelease(version);
  const [packed] = JSON.parse(capture('npm', ['pack', `@cngx/core@${previous}`, '--json', '--pack-destination', sandbox]));
  return join(sandbox, packed.filename);
}

/** The packages the onboarding variant can `ng add` on the fresh app; core is the documented one. */
export const ONBOARDING_PACKAGES = ['core', 'ui'];

/** The `ng add` of the onboarding variant. */
export function onboardingAddArgs(version, preset = DEFAULT_PRESET, lib = 'core') {
  return ['ng', 'add', `@cngx/${lib}@${version}`, ...NG_ADD_FLAGS, ...presetFlags(preset)];
}

/** The onboarding `ng add`, then the same command again, which must change nothing. */
export function onboardingSteps(version, preset = DEFAULT_PRESET, lib = 'core') {
  const args = onboardingAddArgs(version, preset, lib);
  return [
    { label: `ng add @cngx/${lib}`, args, commit: true },
    { label: `ng add @cngx/${lib} again`, args, expect: 'cngx is already set up; nothing changed.', clean: true },
  ];
}

/** Why the installed CDK does not fit the app's Angular, or undefined when its major matches. */
export function companionMismatch(angularVersion, cdkVersion) {
  if (cdkVersion === undefined) {
    return `no @angular/cdk was installed next to @angular/core ${angularVersion}`;
  }
  const major = (version) => version.split('.')[0];
  return major(cdkVersion) === major(angularVersion)
    ? undefined
    : `@angular/cdk ${cdkVersion} is installed for @angular/core ${angularVersion}`;
}

function installedPackageVersion(appDir, name) {
  try {
    return JSON.parse(readFileSync(join(appDir, 'node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return undefined;
  }
}

/** The `ng add` of the stale core leg; the preset of the run is passed on, so both legs install the same one. */
export function staleCoreAddArgs(version, preset = DEFAULT_PRESET) {
  return ['ng', 'add', `@cngx/forms@${version}`, ...NG_ADD_FLAGS, ...presetFlags(preset)];
}

/**
 * An app with an older core installed: `ng add @cngx/forms` must install
 * the packed core and run its ng-add in the same command, which records the
 * packed release for the project.
 */
async function runStaleCoreLeg({ cliSpec, work, tarballFiles, version, registryUrl, staleCore, preset }) {
  const sandbox = mkdtempSync(join(work, 'stale-core-'));
  const appDir = join(sandbox, 'fixture');
  const staleTarball = resolveStaleCore(staleCore, version, sandbox);
  const stale = tarballManifest(staleTarball).version;
  console.log(`\nStale core leg: @cngx/core ${stale} installed, packed ${version}\nSandbox: ${sandbox}\n`);
  run('npx', ['-y', `@angular/cli@${cliSpec}`, 'new', 'fixture', '--defaults', '--skip-git', '--skip-install', '--style=css', '--routing=false', '--ssr=false', '--zoneless=true'], { cwd: sandbox });
  run('npm', ['install'], { cwd: appDir });
  // An app that had an older cngx already has its peers, the CDK among them,
  // at its own Angular; installed the same way as the main leg.
  const angularVersion = installedPackageVersion(appDir, '@angular/core');
  run('npm', ['install', ...peerInstallSpecs(variantPlan('schematics'), angularVersion)], { cwd: appDir });
  const others = tarballFiles.filter((file) => tarballManifest(file).name !== '@cngx/core');
  // The older core peers on its own release of the other packages; the
  // stale state is what `ng add` repairs, so npm is told to accept it.
  run('npm', ['install', '--legacy-peer-deps', staleTarball, ...others], { cwd: appDir });
  useLocalRegistry(appDir, registryUrl);
  const output = await runAsync('npx', staleCoreAddArgs(version, preset), { cwd: appDir });
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

// Runs the command on a pseudo-terminal (python3's pty module) and copies
// this process's stdin into it and its output out, so the Angular CLI and the
// schematic see a terminal while the fixture types the answers. Not
// `pty.spawn`: on Python 3.9 its loop keeps polling stdin after the command
// exits and never returns. The terminal gets a size before the command
// starts; at 0x0 the CLI's install spinner erases lines without end.
const PTY_BRIDGE = `
import fcntl, os, pty, select, struct, sys, termios
pid, fd = pty.fork()
if pid == 0:
    fcntl.ioctl(0, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 120, 0, 0))
    os.execvp(sys.argv[1], sys.argv[1:])
inputs = [fd, 0]
while fd in inputs:
    ready = select.select(inputs, [], [])[0]
    if fd in ready:
        try:
            data = os.read(fd, 4096)
        except OSError:
            data = b''
        if data:
            os.write(1, data)
        else:
            inputs.remove(fd)
    if 0 in ready:
        data = os.read(0, 4096)
        if data:
            os.write(fd, data)
        else:
            inputs.remove(0)
status = os.waitpid(pid, 0)[1]
sys.exit(os.WEXITSTATUS(status) if os.WIFEXITED(status) else 1)
`;
const KEYS = { enter: '\r', down: '\u001b[B', space: ' ' };
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;
// More output than any ng add prints; past it a terminal leg is redrawing
// without end and stops before it floods the CI log.
const MAX_TERMINAL_OUTPUT = 20 * 1024 * 1024;

// Every question a fresh standalone app without ESLint or Material gets on
// the full preset, in the order the schematic asks them.
const QUESTIONS = {
  preset: 'Which cngx setup do you want?',
  libs: 'Which cngx packages do you want?',
  i18n: 'Which language should cngx speak?',
  feedback: 'Provide toasts, alerts and banners at the root?',
  aiTools: 'Which editors should get the cngx MCP server?',
};

/**
 * The terminal legs of the schematics variant. `script` is what the
 * interactive run types once each question shows: `full` one row below the
 * `recommended` default, `data-display` (sixth of the libs) unchecked, the
 * rest left at their defaults. `answers` is what `.cngx/install.json` must
 * record afterwards; `forbid` is output that fails the leg at once.
 */
export function terminalLegs(version) {
  const args = ['ng', 'add', `@cngx/core@${version}`, '--skip-confirmation'];
  const allLibs = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];
  return [
    {
      label: 'ng add @cngx/core in a terminal',
      args,
      env: { CI: undefined },
      script: [
        { prompt: QUESTIONS.preset, keys: [KEYS.down, KEYS.enter] },
        { prompt: QUESTIONS.libs, keys: [...Array(5).fill(KEYS.down), KEYS.space, KEYS.enter] },
        { prompt: QUESTIONS.i18n, keys: [KEYS.enter] },
        { prompt: QUESTIONS.feedback, keys: [KEYS.enter] },
        { prompt: QUESTIONS.aiTools, keys: [KEYS.enter] },
      ],
      forbid: [],
      answers: { preset: 'full', libs: allLibs.filter((lib) => lib !== 'data-display') },
    },
    {
      label: 'ng add @cngx/core in a terminal under CI=true',
      args,
      env: { CI: 'true' },
      script: [],
      forbid: Object.values(QUESTIONS),
      answers: { preset: 'recommended', libs: allLibs },
    },
  ];
}

/** The text of a terminal's output without its colour and cursor sequences. */
export function plainTerminalText(output) {
  return output.replace(ANSI, '');
}

/**
 * The environment of a terminal leg: the fixture's own, with the CLI's
 * analytics question off and `overrides` applied; an `undefined` override
 * removes the variable (GitHub Actions sets CI=true for every step).
 */
export function terminalEnv(base, overrides) {
  const merged = { ...base, NG_CLI_ANALYTICS: 'false', ...overrides };
  return Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined));
}

/**
 * Runs `args` through `npx` under a pseudo-terminal. Each `script` entry
 * waits for its prompt in the output and then types its keys, one at a time;
 * any `forbid` text in the output kills the run. Resolves to the output.
 */
function runInTerminal(args, { cwd, env, script, forbid, timeout = 600_000 }) {
  console.log(`  $ [pty] npx ${args.join(' ')}`);
  return new Promise((done, fail) => {
    const child = spawn('python3', ['-c', PTY_BRIDGE, 'npx', ...args], {
      cwd,
      env: terminalEnv(process.env, env),
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    const pending = [...script];
    let output = '';
    let typing = Promise.resolve();
    let failure;
    const stop = (reason) => {
      failure ??= new Error(reason);
      child.kill('SIGKILL');
    };
    const timer = setTimeout(() => stop(`no exit within ${timeout / 1000}s; waiting for "${pending[0]?.prompt ?? 'the exit'}"`), timeout);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
      if (output.length > MAX_TERMINAL_OUTPUT) {
        stop(`printed more than ${MAX_TERMINAL_OUTPUT / 1024 / 1024} MB; waiting for "${pending[0]?.prompt ?? 'the exit'}"`);
        return;
      }
      const text = plainTerminalText(output);
      const forbidden = forbid.find((line) => text.includes(line));
      if (forbidden !== undefined) {
        stop(`asked "${forbidden}"`);
        return;
      }
      while (pending.length > 0 && text.includes(pending[0].prompt)) {
        const { keys } = pending.shift();
        typing = typing.then(async () => {
          for (const key of keys) {
            await new Promise((wait) => setTimeout(wait, 150));
            child.stdin.write(key);
          }
        });
      }
    });
    child.on('error', fail);
    child.on('close', (code) => {
      clearTimeout(timer);
      child.stdin.end();
      if (failure !== undefined) {
        fail(failure);
      } else if (code !== 0) {
        fail(new Error(`npx ${args.join(' ')} exited with ${code}`));
      } else if (pending.length > 0) {
        fail(new Error(`never asked "${pending[0].prompt}"`));
      } else {
        done(output);
      }
    });
  });
}

/** What of `expected` the install record of `project` answers differently. */
export function answerMismatches(installManifest, project, expected) {
  const answers = installManifest.projects?.[project]?.answers ?? {};
  return Object.entries(expected)
    .filter(([key, value]) => JSON.stringify(answers[key]) !== JSON.stringify(value))
    .map(([key, value]) => `${key} is ${JSON.stringify(answers[key])}, expected ${JSON.stringify(value)}`);
}

// The terminal legs, each on its own copy of the fresh app, which installs
// from the local registry like the main app.
async function runTerminalLegs(copies, version, registryUrl) {
  for (const [leg, appDir] of terminalLegs(version).map((leg, index) => [leg, copies[index]])) {
    console.log(`\n[terminal] ${leg.label}`);
    useLocalRegistry(appDir, registryUrl);
    await runInTerminal(leg.args, { cwd: appDir, env: leg.env, script: leg.script, forbid: leg.forbid });
    const installManifest = JSON.parse(readFileSync(join(appDir, '.cngx', 'install.json'), 'utf8'));
    const mismatches = answerMismatches(installManifest, 'fixture', leg.answers);
    if (mismatches.length > 0) {
      throw new Error(`${leg.label}: ${mismatches.join('; ')}`);
    }
  }
  console.log('\nTerminal legs: the questions took typed answers, CI=true asked none');
}

/** The packages the stale update leg installs at the older release, the ones `ng add @cngx/forms` pins. */
export const STALE_UPDATE_LIBS = ['utils', 'core', 'common', 'forms'];

/**
 * The real `ng update` of the stale update leg: no --migrate-only, so the
 * CLI reads the release from the registry, moves the package group and runs
 * the migrations of the range it crossed; then the same command again, which
 * must change nothing.
 */
export function staleUpdateSteps(version) {
  const args = ['ng', 'update', '@cngx/core'];
  return [
    { label: 'ng update @cngx/core', args, expect: `cngx ${version} migration`, pins: STALE_UPDATE_LIBS, commit: true },
    { label: 'ng update @cngx/core again', args, expect: "Package '@cngx/core' is already up to date.", clean: true },
  ];
}

/**
 * An app on an older release of the package group: `ng update @cngx/core`
 * through the local registry must install the packed release of every
 * member and run the migration keyed to it.
 */
async function runStaleUpdateLeg({ cliSpec, work, version, registryUrl }) {
  const sandbox = mkdtempSync(join(work, 'stale-update-'));
  const appDir = join(sandbox, 'fixture');
  const stale = previousRelease(version);
  console.log(`\nStale update leg: ${STALE_UPDATE_LIBS.join(', ')} at ${stale}, packed ${version}\nSandbox: ${sandbox}\n`);
  run('npx', ['-y', `@angular/cli@${cliSpec}`, 'new', 'fixture', '--defaults', '--skip-git', '--skip-install', '--style=css', '--routing=false', '--ssr=false', '--zoneless=true'], { cwd: sandbox });
  run('npm', ['install'], { cwd: appDir });
  const angularVersion = installedPackageVersion(appDir, '@angular/core');
  run('npm', ['install', ...peerInstallSpecs(variantPlan('schematics'), angularVersion)], { cwd: appDir });
  // The older release comes from the public registry, before the scope is
  // routed to the local one, which serves the packed release only; a
  // `file:` dependency is one ng update cannot move. Pinned exactly, as
  // ng add pins. Its peer range may stop below the app's Angular major,
  // which is what the update repairs.
  const staleSpecs = STALE_UPDATE_LIBS.map((lib) => `@cngx/${lib}@${stale}`);
  run('npm', ['install', '--legacy-peer-deps', '--save-exact', ...staleSpecs], { cwd: appDir });
  useLocalRegistry(appDir, registryUrl);
  await runSteps(appDir, version, staleUpdateSteps(version), 'stale update');
  const installed = installedPackageVersion(appDir, '@cngx/core');
  if (installed !== version) {
    throw new Error(`stale update leg: node_modules holds @cngx/core ${installed}, expected ${version}`);
  }
  console.log(`\nStale update leg: ng update moved ${STALE_UPDATE_LIBS.join(', ')} from ${stale} to ${version}`);
}

async function main() {
  const { angular, variant, tarballs, work, ignorePeers, staleCore, preset, add } = parseArgs(process.argv.slice(2));
  const { cliSpec, exact } = parseAngularSpec(angular);
  const plan = variantPlan(variant);
  const checks = presetPlan(preset, { standalone: plan.standalone });

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
  const presetLine = plan.schematics ? `, preset ${preset}` : '';
  console.log(`\nFixture: Angular ${angular}, variant ${variant}${presetLine}\nSandbox: ${sandbox}\n`);

  const newArgs = [
    '-y', `@angular/cli@${cliSpec}`, 'new', 'fixture', '--defaults', '--skip-git', '--skip-install',
    '--style=css', `--routing=${plan.routing}`, `--standalone=${plan.standalone}`, `--ssr=${plan.ssr}`, `--zoneless=${plan.zoneless}`,
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

  const version = plan.schematics
    ? tarballManifest(tarballFiles.find((file) => tarballManifest(file).name === '@cngx/core')).version
    : null;
  // Copies of the app before anything cngx needs is installed, so the
  // terminal legs onboard a fresh app without a second ng new and install.
  const terminalCopies =
    plan.schematics && !plan.onboarding
      ? terminalLegs(version).map((_leg, index) => {
          const copy = join(sandbox, `fixture-terminal-${index}`);
          cpSync(appDir, copy, { recursive: true, verbatimSymlinks: true });
          return copy;
        })
      : [];

  if (!plan.onboarding) {
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
  }

  let registry = null;
  if (plan.schematics) {
    registry = await startLocalRegistry(tarballFiles);
    useLocalRegistry(appDir, registry.url);
  }
  try {
    if (plan.onboarding) {
      if (add !== 'core') {
        // What the docs ask before any package but core on a fresh app: the
        // CDK on the app's major, or the CLI's pre-install of the package
        // fetches the newest CDK the peers allow and stops with ERESOLVE.
        run('npm', ['install', ...peerInstallSpecs(plan, installedAngular)], { cwd: appDir });
      }
      await runSteps(appDir, version, onboardingSteps(version, preset, add), 'onboarding');
      const mismatch = companionMismatch(installedAngular, installedPackageVersion(appDir, '@angular/cdk'));
      if (mismatch !== undefined) {
        throw new Error(`onboarding: ${mismatch}`);
      }
      const versions = angularVersionsInTree(appDir);
      if (versions.length !== 1) {
        throw new Error(`Expected one @angular/core in the tree, found ${versions.join(', ')}`);
      }
      console.log(`\nOnboarding: @angular/cdk ${installedPackageVersion(appDir, '@angular/cdk')} next to @angular/core ${installedAngular}`);
    } else if (plan.schematics) {
      await runSteps(appDir, version, schematicsSteps(version, preset), 'schematics');
    } else {
      writeFileSync(join(appDir, 'src', 'app', 'app.ts'), renderAppSource(plan));
      if (plan.matcherSpec) {
        writeFileSync(join(appDir, 'src', 'app', 'app.spec.ts'), renderMatcherSpec());
      }
    }
    if (plan.schematics && checks.noBudgetWarnings) {
      const warnings = budgetWarnings(runEchoed('npx', ['ng', 'build'], { cwd: appDir }));
      if (warnings.length > 0) {
        throw new Error(`ng build exceeded a budget:\n  ${warnings.join('\n  ')}`);
      }
    } else {
      run('npx', ['ng', 'build'], { cwd: appDir });
    }
    if ((plan.schematics && checks.ngTest) || plan.matcherSpec) {
      run('npx', ['ng', 'test', '--watch=false'], { cwd: appDir });
    }
    if (plan.schematics && staleCore !== null) {
      await runStaleCoreLeg({ cliSpec, work, tarballFiles, version, registryUrl: registry.url, staleCore, preset });
      if (staleCore === 'previous') {
        await runStaleUpdateLeg({ cliSpec, work, version, registryUrl: registry.url });
      } else {
        // ng update moves registry releases only, so a stale core from a
        // tarball has no older group to install and update from.
        console.log('\nStale update leg: skipped (needs --stale-core previous; ng update cannot move a tarball install)');
      }
    } else if (plan.schematics) {
      console.log('\nStale core and stale update legs: skipped (pass --stale-core <tgz | previous> to run them)');
    }
    if (terminalCopies.length > 0) {
      await runTerminalLegs(terminalCopies, version, registry.url);
    }
  } finally {
    await registry?.close();
  }

  if (plan.smoke) {
    const errors = await smoke(appDir, plan, plan.schematics ? checks : {});
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
