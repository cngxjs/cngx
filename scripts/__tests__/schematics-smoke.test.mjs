import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { NodeModulesEngineHost } from '@angular-devkit/schematics/tools';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';
import { checkReleaseMigrations, declaresSchematics } from '../publish.mjs';

/**
 * Smoke guard for the bundled schematics under dist/. Runs the built
 * collection, not the sources, so it proves the esbuild bundle resolves its
 * externals and the collection wiring the CLI will load. Needs
 * `npm run build:libs` (CI downloads the build output before this job).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORE_COLLECTION = join(ROOT, 'dist', 'core', 'schematics', 'collection.json');
const UI_COLLECTION = join(ROOT, 'dist', 'ui', 'schematics', 'collection.json');

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
const BOOLEAN_FLAGS = ['runtimeSwitch', 'lint', 'a11yPreferences', 'feedback', 'floatingFallback', 'yes', 'prompts', 'quiet'];
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
    version = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'package.json'), 'utf8')).version;
    appTree = await createAppTree(runner);
  });

  it('ng-add adds @cngx/utils at the core version', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const manifest = JSON.parse(tree.readText('package.json'));

    expect(manifest.dependencies['@cngx/utils']).toBe(version);
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
      expect(messages.some((message) => /^cngx planned \d+ changes\.$/.test(message))).toBe(true);
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

  it('the 0.1.0 migration records the installed release in the manifest', async () => {
    const ngAdd = new SchematicTestRunner('@cngx/core', requireDist(CORE_COLLECTION));
    const onboarded = await ngAdd.runSchematic('ng-add', { preset: 'minimal' }, await createAppTree(ngAdd));
    overwriteRecord(onboarded, { cngxVersion: '0.1.0-rc.0' });

    const tree = await runner.runSchematic('migration-v0.1.0', {}, onboarded);

    expect(recordOf(tree).cngxVersion).toBe(version);
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
      expect(messages).toContain('cngx 0.1.1 migration planned 1 change.');
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
});

describe('dist/ui/schematics ng-add shim', () => {
  let appTree;
  let version;

  beforeAll(async () => {
    const runner = new SchematicTestRunner('@cngx/ui', requireDist(UI_COLLECTION));
    version = JSON.parse(readFileSync(join(ROOT, 'dist', 'ui', 'package.json'), 'utf8')).version;
    appTree = await createAppTree(runner);
  });

  it('delegates to @cngx/core ng-add in the same run when core resolves', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const tree = await runner.runSchematic('ng-add', { preset: 'full' }, await createAppTree(runner));
    const manifest = JSON.parse(tree.readText('package.json'));

    expect(manifest.dependencies['@cngx/core']).toBe(version);
    expect(manifest.dependencies['@cngx/utils']).toBe(version);
    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package']);
  });

  it('forwards the flags ng add passes before the install to the core ng-add, its own lib added', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const tree = await runner.runSchematic(
      'ng-add',
      { aiTools: 'claude,vscode', libs: 'core', ...PRE_INSTALL_FALSE },
      await createAppTree(runner),
    );
    const { answers } = recordOf(tree);

    expect(answers).toMatchObject({ aiTools: ['claude', 'vscode'], libs: ['core', 'ui'], lint: false, a11yPreferences: false });
  });

  it('installs @cngx/core first and runs its ng-add as a task when core is missing', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    const tree = await runner.runSchematic('ng-add', { preset: 'minimal' }, appTree);
    const manifest = JSON.parse(tree.readText('package.json'));
    const delegate = runner.tasks.find((task) => task.name === 'run-schematic');

    expect(manifest.dependencies['@cngx/core']).toBe(version);
    expect(manifest.dependencies['@cngx/ui']).toBe(version);
    expect(runner.tasks.map((task) => task.name)).toEqual(['node-package', 'run-schematic']);
    expect(delegate.options).toMatchObject({ collection: '@cngx/core', name: 'ng-add', options: { preset: 'minimal' } });
  });

  it('reports a broken @cngx/core install instead of treating it as missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cngx-broken-core-'));
    try {
      writeFileSync(join(dir, 'collection.json'), '{ not json');
      const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
      runner.registerCollection('@cngx/core', join(dir, 'collection.json'));

      await expect(runner.runSchematic('ng-add', {}, appTree)).rejects.toThrow(
        /@cngx\/core is installed but its ng-add collection failed to load/,
      );
      expect(runner.tasks).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('replaces an older @cngx pin with the lockstep version and says so', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const pinned = await runner.runSchematic('ng-add', {}, appTree);
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
    expect(messages).toEqual(
      expect.arrayContaining([
        `Replacing @cngx/core@0.0.1 with ${version} so every @cngx package stays on one version.`,
        `Replacing @cngx/utils@0.0.1 with ${version} so every @cngx package stays on one version.`,
      ]),
    );
  });

  it('stays silent when the app already pins the lockstep version', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    runner.registerCollection('@cngx/core', requireDist(CORE_COLLECTION));
    const onboarded = await runner.runSchematic('ng-add', {}, appTree);
    const messages = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));

    await runner.runSchematic('ng-add', {}, onboarded);

    expect(messages.filter((message) => message.startsWith('Replacing'))).toEqual([]);
  });
});

// Every schematic entry ships inside a published package, so its size is
// paid on every install. The bundled renderer and prompt libraries take about
// 140 KB of it (listr2 alone 52 KB); the rest is the onboarding itself,
// including the editor configs the AI tooling step writes.
const MAX_MINIFIED = 256 * 1024;
const MAX_GZIP = 90 * 1024;
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

describe('schematic bundle budget', () => {
  it('finds a built entry for every declared collection', () => {
    expect(schematicEntries()).toEqual(expect.arrayContaining(['core/schematics/ng-add/index.js', 'ui/schematics/ng-add/index.js']));
    expect(schematicEntries().filter((file) => !existsSync(join(ROOT, 'dist', file)))).toEqual([]);
  });

  it.each(schematicEntries())('keeps dist/%s under 256 KB minified and 90 KB gzip', (file) => {
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
