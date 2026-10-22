import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { SchematicEngine } from '@angular-devkit/schematics';
import { NodeModulesEngineHost } from '@angular-devkit/schematics/tools';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';
import { checkReleaseMigrations, declaresSchematics, replaceVersionInDist, stampManifest } from '../publish.mjs';
import { externalRequireViolations } from '../schematics-externals.mjs';

/**
 * Smoke guard for the bundled schematics under dist/. Runs the built
 * collection, not the sources, so it proves the esbuild bundle resolves its
 * externals and the collection wiring the CLI will load. Needs
 * `npm run build:libs` (CI downloads the build output before this job).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// dist/ is an unstamped local build (`0.0.0-PLACEHOLDER`), which pins no
// version. The pin and shim cases run a copy stamped the way publish stamps
// a release; it sits under dist/ so the bundles still resolve their
// externals from the workspace node_modules.
const STAMPED_ROOT = join(ROOT, 'dist', '.smoke-stamped');
const STAMPED_VERSION = '0.1.0';
const stamped = (lib, ...path) => join(STAMPED_ROOT, lib, ...path);
const CORE_COLLECTION = stamped('core', 'schematics', 'collection.json');
const UI_COLLECTION = stamped('ui', 'schematics', 'collection.json');
const UNSTAMPED_CORE_COLLECTION = join(ROOT, 'dist', 'core', 'schematics', 'collection.json');

beforeAll(() => {
  rmSync(STAMPED_ROOT, { recursive: true, force: true });
  for (const lib of PACKED_LIBS) {
    const source = join(ROOT, 'dist', lib);
    if (!existsSync(join(source, 'schematics'))) {
      continue;
    }
    cpSync(join(source, 'schematics'), stamped(lib, 'schematics'), { recursive: true });
    const manifest = stampManifest(JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')), STAMPED_VERSION);
    writeFileSync(stamped(lib, 'package.json'), JSON.stringify(manifest, null, 2));
    replaceVersionInDist(stamped(lib), STAMPED_VERSION);
  }
});

afterAll(() => {
  rmSync(STAMPED_ROOT, { recursive: true, force: true });
});

// `ng add` parses its flags before the package is installed, without the
// schema's option types (@angular/cli src/commands/add/cli.js:121-134,
// `.strict(false)`): `--ai-tools claude,vscode` reaches the schematic as one
// string and `--lint=false` as "false". The normalize middleware keeps only
// the last value of a repeated flag
// (src/command-builder/utilities/normalize-options-middleware.js:25-33), so
// the comma form is the one multi-value spelling. It also drops
// `interactive` and `defaults` from the options (src/commands/add/cli.js,
// `executeSchematic`) and the workflow never hands them to the rule's
// context, so the ng-add shell reads them from `process.argv`
// (`readPromptFlags`). Verified against this CLI major; a new one must be
// re-checked (schematics accepted debt 12).
const VERIFIED_CLI_MAJOR = 21;
const BOOLEAN_FLAGS = ['runtimeSwitch', 'lint', 'a11yPreferences', 'feedback', 'floatingFallback', 'starter', 'yes', 'prompts', 'quiet'];
const PRE_INSTALL_FALSE = Object.fromEntries(BOOLEAN_FLAGS.map((flag) => [flag, 'false']));

function requireDist(file) {
  if (!existsSync(file)) {
    throw new Error(`${file} is missing - run \`npm run build:libs\` first`);
  }
  return file;
}

async function createAppTree(runner) {
  const workspace = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '21.2.0',
  });
  return runner.runExternalSchematic('@schematics/angular', 'application', { name: 'app' }, workspace);
}

// The shims read the core the package manager placed before they load it,
// so a run that should delegate in the same run needs core at the shim's
// version on disk.
function withInstalledCore(tree, version) {
  tree.create('node_modules/@cngx/core/package.json', JSON.stringify({ name: '@cngx/core', version }));
  return tree;
}

// The install record ng add keeps for the one project `createAppTree` makes.
function recordOf(tree) {
  return JSON.parse(tree.readText('.cngx/install.json')).projects.app;
}

function overwriteRecord(tree, patch) {
  const manifest = JSON.parse(tree.readText('.cngx/install.json'));
  const projects = { ...manifest.projects, app: { ...manifest.projects.app, ...patch } };
  tree.overwrite('.cngx/install.json', JSON.stringify({ ...manifest, projects }, null, 2));
}

describe('dist/core/schematics', () => {
  let runner;
  let appTree;
  let version;

  beforeAll(async () => {
    runner = new SchematicTestRunner('@cngx/core', requireDist(CORE_COLLECTION));
    version = JSON.parse(readFileSync(stamped('core', 'package.json'), 'utf8')).version;
    appTree = await createAppTree(runner);
  });

  it('ng-add adds @cngx/utils at the core version', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const manifest = JSON.parse(tree.readText('package.json'));

    expect(manifest.dependencies['@cngx/utils']).toBe(version);
  });

  it('ng-add of an unstamped local build keeps the declared @cngx versions and names pack-libs', async () => {
    const unstamped = new SchematicTestRunner('@cngx/core', requireDist(UNSTAMPED_CORE_COLLECTION));
    const messages = [];
    unstamped.logger.subscribe((entry) => messages.push(entry.message));
    const tree = await unstamped.runSchematic('ng-add', { preset: 'minimal' }, await createAppTree(unstamped));
    const manifest = JSON.parse(tree.readText('package.json'));

    expect(Object.keys(manifest.dependencies).filter((name) => name.startsWith('@cngx/'))).toEqual([]);
    expect(messages.some((line) => line.includes('Keep the declared @cngx versions') && line.includes('node scripts/pack-libs.mjs'))).toBe(true);
  });

  it('ng-add is one stage: the install is its only task', async () => {
    // runSchematic writes into the tree it is given, so a fresh app keeps the
    // dependency planned (an onboarded app installs nothing).
    await runner.runSchematic('ng-add', { preset: 'minimal' }, await createAppTree(runner));

    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package']);
  });

  it('ships no setup stage in the collection', () => {
    const collection = JSON.parse(readFileSync(CORE_COLLECTION, 'utf8'));

    expect(Object.keys(collection.schematics)).toEqual(['ng-add']);
  });

  describe('without a terminal', () => {
    const isTTY = process.stdout.isTTY;

    afterEach(() => {
      process.stdout.isTTY = isTTY;
    });

    it('ng-add prints the plan and the summary without prompting', async () => {
      process.stdout.isTTY = false;
      const messages = [];
      runner.logger.subscribe((entry) => messages.push(entry.message));

      const tree = await runner.runSchematic('ng-add', {}, await createAppTree(runner));

      expect(messages.some((message) => /^Planned \(\d+\):$/.test(message))).toBe(true);
      expect(messages.some((message) => /^cngx applied \d+ changes\.$/.test(message))).toBe(true);
      expect(tree.exists('.cngx/install.json')).toBe(true);
    });
  });

  it('declares no option the ng add command strips', () => {
    const schema = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'schematics', 'ng-add', 'schema.json'), 'utf8'));

    expect(Object.keys(schema.properties)).not.toContain('dryRun');
    expect(Object.keys(schema.properties)).not.toContain('interactive');
    expect(Object.keys(schema.properties)).not.toContain('verbose');
  });

  describe('with the flags ng add passes before the install', () => {
    it.each([
      ['a single list entry', { aiTools: 'claude', libs: 'core' }, { aiTools: ['claude'], libs: ['core'] }],
      ['a comma list', { aiTools: 'claude,vscode', libs: 'core,forms' }, { aiTools: ['claude', 'vscode'], libs: ['core', 'forms'] }],
    ])('ng-add records %s and every boolean given as "false"', async (_name, lists, recorded) => {
      const tree = await runner.runSchematic('ng-add', { ...lists, ...PRE_INSTALL_FALSE }, await createAppTree(runner));
      const { answers } = recordOf(tree);

      expect(answers).toMatchObject({
        ...recorded,
        runtimeSwitch: false,
        lint: false,
        a11yPreferences: false,
        feedback: false,
        floatingFallback: false,
        starter: false,
      });
    });

    it('ng-add names an unknown or repeated list entry', async () => {
      await expect(runner.runSchematic('ng-add', { aiTools: 'emacs' }, appTree)).rejects.toThrow(
        '"emacs" is not a valid answer for --ai-tools. Expected one of: claude, cursor, vscode.',
      );
      await expect(runner.runSchematic('ng-add', { aiTools: 'claude,claude' }, appTree)).rejects.toThrow(
        '"claude" is given more than once for --ai-tools.',
      );
    });
  });

  // The CLI types an option by the first branch of its `oneOf`
  // (src/utilities/json-schema.js:231-236). A list must parse as a string on
  // both sides of the install; a boolean keeps `--no-flag` once installed.
  it('orders the schema branches so the pre-install form of every flag validates', () => {
    const schema = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'schematics', 'ng-add', 'schema.json'), 'utf8'));
    const properties = Object.entries(schema.properties);
    const branches = (property) => property.oneOf ?? [];

    expect(properties.filter(([, property]) => property.type === 'array' || property.type === 'boolean')).toEqual([]);
    for (const [name, property] of properties.filter(([, p]) => branches(p).some((branch) => branch.type === 'array'))) {
      expect([name, branches(property)[0]]).toEqual([name, { type: 'string' }]);
    }
    const booleans = properties.filter(([, p]) => branches(p).some((branch) => branch.type === 'boolean'));
    expect(booleans.map(([name]) => name)).toEqual(BOOLEAN_FLAGS);
    for (const [name, property] of booleans) {
      expect([name, branches(property)]).toEqual([name, [{ type: 'boolean' }, { type: 'string', enum: ['true', 'false'] }]]);
    }
  });

  it('runs against the @angular/cli major the pre-install flag parsing was verified on', () => {
    const cli = JSON.parse(readFileSync(join(ROOT, 'node_modules', '@angular', 'cli', 'package.json'), 'utf8'));
    const major = Number(cli.version.split('.')[0]);

    expect(
      major,
      `@angular/cli ${cli.version}: re-check how ng add parses flags before the install (schematics accepted debt 12), then bump VERIFIED_CLI_MAJOR`,
    ).toBe(VERIFIED_CLI_MAJOR);
  });
});

describe('dist/core/schematics migrations', () => {
  const MIGRATIONS = join(ROOT, 'dist', 'core', 'schematics', 'migrations', 'migrations.json');
  let runner;
  let version;

  beforeAll(() => {
    runner = new SchematicTestRunner('@cngx/core', requireDist(MIGRATIONS));
    version = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'package.json'), 'utf8')).version;
  });

  it('is the collection the package.json ng-update entry names', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'package.json'), 'utf8'));

    expect(join(ROOT, 'dist', 'core', manifest['ng-update'].migrations)).toBe(MIGRATIONS);
  });

  // What publish.mjs does to the collection of a release without its own
  // migration, on a copy beside the original so the factory paths resolve.
  it('the stamped refresh entry of a later release re-checks an onboarded app', async () => {
    const ngAdd = new SchematicTestRunner('@cngx/core', requireDist(CORE_COLLECTION));
    const onboarded = await ngAdd.runSchematic('ng-add', { preset: 'minimal' }, await createAppTree(ngAdd));
    overwriteRecord(onboarded, { cngxVersion: '0.1.0' });
    const stamped = checkReleaseMigrations(MIGRATIONS, '0.1.1', '.js');
    const copy = join(dirname(MIGRATIONS), 'migrations.smoke-refresh.json');
    writeFileSync(copy, JSON.stringify(stamped));

    try {
      const refresh = new SchematicTestRunner('@cngx/core', copy);
      const messages = [];
      refresh.logger.subscribe((entry) => messages.push(entry.message));
      const tree = await refresh.runSchematic('migration-v0.1.1-refresh', {}, onboarded);

      expect(recordOf(tree).cngxVersion).toBe(version);
      expect(messages[0]).toBe('cngx 0.1.1 migration');
      expect(messages).toContain('cngx 0.1.1 migration applied 1 change.');
    } finally {
      rmSync(copy, { force: true });
    }
  });
});

// The CLI finds a collection through `require.resolve('<pkg>/package.json')`
// and fails hard on anything but MODULE_NOT_FOUND, so a package whose
// `exports` map hides its manifest cannot answer `ng add`.
describe('every published package as the CLI resolves it', () => {
  let modules;

  beforeAll(() => {
    modules = mkdtempSync(join(tmpdir(), 'cngx-resolve-'));
    mkdirSync(join(modules, 'node_modules', '@cngx'), { recursive: true });
    for (const lib of PACKED_LIBS) {
      symlinkSync(join(ROOT, 'dist', lib), join(modules, 'node_modules', '@cngx', lib), 'dir');
    }
  });

  afterAll(() => {
    rmSync(modules, { recursive: true, force: true });
  });

  it.each(PACKED_LIBS)(
    'loads the ng-add collection of @cngx/%s through its package.json',
    (lib) => {
      requireDist(join(ROOT, 'dist', lib, 'schematics', 'collection.json'));
      const host = new NodeModulesEngineHost([modules]);

      expect(Object.keys(host.createCollectionDescription(`@cngx/${lib}`).schematics)).toContain(
        'ng-add',
      );
    },
  );

  // A factory path that names a missing export loads as a collection and only
  // fails when the CLI resolves the rule, so the schematic is created here.
  it.each(PACKED_LIBS)('resolves the ng-add factory of @cngx/%s', (lib) => {
    const engine = new SchematicEngine(new NodeModulesEngineHost([modules]));

    expect(() => engine.createCollection(`@cngx/${lib}`).createSchematic('ng-add')).not.toThrow();
  });
});

describe('the shipped schematics bundles', () => {
  // Every require left in a shipped bundle resolves from the consumer's CLI
  // install; @schematics/angular 22 no longer vendors TypeScript, so a require
  // into its third_party folder crashes ng add at load time on that CLI.
  it.each(PACKED_LIBS)('of @cngx/%s require only Node builtins and the declared externals', (lib) => {
    const root = requireDist(join(ROOT, 'dist', lib, 'schematics'));
    const bundles = readdirSync(root, { recursive: true }).filter((file) => String(file).endsWith('.js'));
    const violations = bundles.flatMap((file) =>
      externalRequireViolations(readFileSync(join(root, file), 'utf8')).map((specifier) => `${file}: ${specifier}`),
    );

    expect(bundles.length).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it.each(PACKED_LIBS)('of @cngx/%s pin themselves to commonjs', (lib) => {
    const marker = requireDist(join(ROOT, 'dist', lib, 'schematics', 'package.json'));

    expect(JSON.parse(readFileSync(marker, 'utf8'))).toEqual({ type: 'commonjs' });
  });

  // ng-packagr 22 writes "type": "module" into the package root; the nested
  // marker keeps the CommonJS bundles loadable. The copy sits under dist/ so
  // the bundles still resolve their externals from the workspace.
  it('load the core ng-add under a package root with "type": "module"', () => {
    const modules = join(ROOT, 'dist', '.smoke-esm-root');
    const pkgDir = join(modules, 'node_modules', '@cngx', 'core');
    rmSync(modules, { recursive: true, force: true });
    try {
      cpSync(requireDist(join(ROOT, 'dist', 'core', 'schematics')), join(pkgDir, 'schematics'), { recursive: true });
      const manifest = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'package.json'), 'utf8'));
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ ...manifest, type: 'module' }, null, 2));
      const engine = new SchematicEngine(new NodeModulesEngineHost([modules]));

      expect(() => engine.createCollection('@cngx/core').createSchematic('ng-add')).not.toThrow();
    } finally {
      rmSync(modules, { recursive: true, force: true });
    }
  });
});

const SHIM_LIBS = PACKED_LIBS.filter((lib) => lib !== 'core');

describe.each(SHIM_LIBS)('dist/%s/schematics ng-add shim', (lib) => {
  const collection = stamped(lib, 'schematics', 'collection.json');
  let appTree;
  let version;

  beforeAll(async () => {
    const runner = new SchematicTestRunner(`@cngx/${lib}`, requireDist(collection));
    version = JSON.parse(readFileSync(stamped(lib, 'package.json'), 'utf8')).version;
    appTree = await createAppTree(runner);
  });

  it('delegates to @cngx/core ng-add in the same run when core resolves', async () => {
    const runner = new SchematicTestRunner(`@cngx/${lib}`, collection);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const tree = await runner.runSchematic('ng-add', { preset: 'full' }, withInstalledCore(await createAppTree(runner), version));
    const manifest = JSON.parse(tree.readText('package.json'));

    expect(manifest.dependencies['@cngx/core']).toBe(version);
    expect(manifest.dependencies['@cngx/utils']).toBe(version);
    expect(manifest.dependencies[`@cngx/${lib}`]).toBe(version);
    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package']);
  });

  it('installs @cngx/core first and runs its ng-add as a task when core is missing', async () => {
    const runner = new SchematicTestRunner(`@cngx/${lib}`, collection);
    const tree = await runner.runSchematic('ng-add', { preset: 'minimal' }, appTree);
    const manifest = JSON.parse(tree.readText('package.json'));
    const delegate = runner.tasks.find((task) => task.name === 'run-schematic');

    expect(manifest.dependencies['@cngx/core']).toBe(version);
    expect(manifest.dependencies[`@cngx/${lib}`]).toBe(version);
    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package', 'run-schematic']);
    expect(delegate.options).toMatchObject({ collection: '@cngx/core', name: 'ng-add', options: { preset: 'minimal' } });
  });
});

describe('dist/ui/schematics ng-add shim', () => {
  let appTree;
  let version;

  beforeAll(async () => {
    const runner = new SchematicTestRunner('@cngx/ui', requireDist(UI_COLLECTION));
    version = JSON.parse(readFileSync(stamped('ui', 'package.json'), 'utf8')).version;
    appTree = await createAppTree(runner);
  });

  it('forwards the flags ng add passes before the install to the core ng-add, its own lib added', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const tree = await runner.runSchematic(
      'ng-add',
      { aiTools: 'claude,vscode', libs: 'core', ...PRE_INSTALL_FALSE },
      withInstalledCore(await createAppTree(runner), version),
    );
    const { answers } = recordOf(tree);

    expect(answers).toMatchObject({ aiTools: ['claude', 'vscode'], libs: ['core', 'ui'], lint: false, a11yPreferences: false });
  });

  it('installs its own core version over an older installed core', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    const tree = await runner.runSchematic('ng-add', {}, withInstalledCore(await createAppTree(runner), '0.0.9'));

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe(version);
    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package', 'run-schematic']);
  });

  it('reports a broken @cngx/core install instead of treating it as missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cngx-broken-core-'));
    try {
      writeFileSync(join(dir, 'collection.json'), '{ not json');
      const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
      runner.registerCollection('@cngx/core', join(dir, 'collection.json'));

      await expect(runner.runSchematic('ng-add', {}, withInstalledCore(await createAppTree(runner), version))).rejects.toThrow(
        /@cngx\/core is installed but its ng-add collection failed to load/,
      );
      expect(runner.tasks).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('replaces an older @cngx pin with the lockstep version and names each replacement once', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const pinned = await runner.runSchematic('ng-add', {}, withInstalledCore(await createAppTree(runner), version));
    const manifest = JSON.parse(pinned.readText('package.json'));
    manifest.dependencies['@cngx/core'] = '0.0.1';
    manifest.dependencies['@cngx/utils'] = '0.0.1';
    pinned.overwrite('package.json', JSON.stringify(manifest, null, 2));
    const messages = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    const tree = await runner.runSchematic('ng-add', {}, pinned);
    const result = JSON.parse(tree.readText('package.json'));

    expect(result.dependencies['@cngx/core']).toBe(version);
    expect(result.dependencies['@cngx/utils']).toBe(version);
    // The shim pins @cngx/core before core plans anything and says so; the
    // plan names the pin it replaces itself.
    const named = (name) => messages.filter((message) => message.includes(name) && message.includes('0.0.1'));
    expect(named('@cngx/core')).toEqual([`Replacing @cngx/core@0.0.1 with ${version} so every @cngx package stays on one version.`]);
    expect(named('@cngx/utils')).toEqual([expect.stringContaining(`Add @cngx/utils@${version} - replaces 0.0.1;`)]);
  });

  it('stays silent when the app already pins the lockstep version', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const onboarded = await runner.runSchematic('ng-add', {}, withInstalledCore(await createAppTree(runner), version));
    const messages = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runner.runSchematic('ng-add', {}, onboarded);

    expect(messages.filter((message) => message.startsWith('Replacing'))).toEqual([]);
  });
});

// Every schematic entry ships inside a published package, so its size is
// paid on every install. The bundled renderer and prompt libraries take about
// 140 KB of it (listr2 alone 52 KB); the rest is the onboarding itself,
// including the editor configs the AI tooling step writes. The full-preset
// starter step (scaffold detection against the generated catalog, the
// starter plan, its re-run checks) added about 22 KB minified and 3 KB gzip
// to ng-add, which was at 255 KB before it: ng-add measured 277,658 B
// minified and 88,268 B gzip when the budget moved from 256 / 90 KB. The
// starter's page files ship next to the bundle (`ng-add/files/starter`),
// not inside it, so they do not count here. The `ng new --standalone=false`
// spec bodies of both CLI majors, raw and Prettier-formatted, which the
// outlets step compares an NgModule spec against exactly, took the catalog
// from 21 to 39 KB: ng-add measured 308,306 B minified and 92,328 B gzip
// when the minified budget moved from 288 KB.
const MAX_MINIFIED = 320 * 1024;
const MAX_GZIP = 96 * 1024;
// A shim only adds core and delegates; it pulls nothing from the renderer
// or the prompts, which `sideEffects: false` on the source package lets
// esbuild drop.
const MAX_SHIM_MINIFIED = 20 * 1024;

// The entries come from the source manifests, not from dist/: every factory a
// declared collection or an `ng-update` migrations file names must have a
// built bundle, so a declared entry missing from dist/ fails here instead of
// dropping out of the budget.
function factoryEntries(lib, manifest) {
  const dir = dirname(manifest);
  const { schematics } = JSON.parse(readFileSync(join(ROOT, 'projects', lib, manifest), 'utf8'));
  return Object.values(schematics).map(({ factory }) => join(lib, dir, `${factory.split('#')[0]}.js`));
}

function schematicEntries() {
  const projects = join(ROOT, 'projects');
  return readdirSync(projects, { withFileTypes: true })
    .filter((lib) => lib.isDirectory() && existsSync(join(projects, lib.name, 'package.json')))
    .flatMap((lib) => {
      const pkg = JSON.parse(readFileSync(join(projects, lib.name, 'package.json'), 'utf8'));
      if (!declaresSchematics(pkg)) {
        return [];
      }
      const migrations = pkg['ng-update']?.migrations;
      // The refresh factory has no source key; publish.mjs keys it per release.
      return [
        ...factoryEntries(lib.name, pkg.schematics),
        ...(migrations === undefined
          ? []
          : [...factoryEntries(lib.name, migrations), join(lib.name, dirname(migrations), 'refresh', 'index.js')]),
      ];
    });
}

// A relative `$schema` points into the workspace's node_modules, which a
// consumer's install does not have; the shipped collections leave it out.
describe('shipped collection files', () => {
  const collections = PACKED_LIBS.flatMap((lib) =>
    [join(lib, 'schematics', 'collection.json'), join(lib, 'schematics', 'migrations', 'migrations.json')].filter((file) =>
      existsSync(join(ROOT, 'dist', file)),
    ),
  );

  it.each(collections)('dist/%s carries no $schema', (file) => {
    expect(JSON.parse(readFileSync(join(ROOT, 'dist', file), 'utf8'))).not.toHaveProperty('$schema');
  });
});

describe('schematic bundle budget', () => {
  it('finds a built entry for every declared collection', () => {
    expect(schematicEntries()).toEqual(expect.arrayContaining(['core/schematics/ng-add/index.js', 'ui/schematics/ng-add/index.js']));
    expect(schematicEntries().filter((file) => !existsSync(join(ROOT, 'dist', file)))).toEqual([]);
  });

  it('ships the files ng-add reads at run time next to its bundle', () => {
    const dir = join(ROOT, 'dist', 'core', 'schematics', 'ng-add', 'files', 'starter');
    const source = join(ROOT, 'projects', 'core', 'schematics', 'ng-add', 'files', 'starter');

    expect(readdirSync(dir).sort()).toEqual(readdirSync(source).sort());
    for (const file of readdirSync(source)) {
      expect({ file, same: readFileSync(join(dir, file), 'utf8') === readFileSync(join(source, file), 'utf8') }).toEqual({ file, same: true });
    }
  });

  it.each(schematicEntries())('keeps dist/%s under 320 KB minified and 96 KB gzip', (file) => {
    const content = readFileSync(join(ROOT, 'dist', file));

    expect(content.length).toBeLessThanOrEqual(MAX_MINIFIED);
    expect(gzipSync(content).length).toBeLessThanOrEqual(MAX_GZIP);
  });

  it.each(schematicEntries().filter((file) => !file.startsWith('core/')))(
    'keeps the shim dist/%s under 20 KB minified',
    (file) => {
      expect(readFileSync(join(ROOT, 'dist', file)).length).toBeLessThanOrEqual(MAX_SHIM_MINIFIED);
    },
  );
});
