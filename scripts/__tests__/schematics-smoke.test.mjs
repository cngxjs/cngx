import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

/**
 * Smoke guard for the bundled schematics under dist/. Runs the built
 * collection, not the sources, so it proves the esbuild bundle resolves its
 * externals and the collection wiring the CLI will load. Needs
 * `npm run build:libs` (CI downloads the build output before this job).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORE_COLLECTION = join(ROOT, 'dist', 'core', 'schematics', 'collection.json');
const UI_COLLECTION = join(ROOT, 'dist', 'ui', 'schematics', 'collection.json');

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

      expect(messages).toEqual(expect.arrayContaining(['Planned (1):', 'cngx planned 1 change.']));
      expect(tree.exists('.cngx/spike.json')).toBe(false);
    });
  });

  it('declares no option the ng add command strips', () => {
    const schema = JSON.parse(readFileSync(join(ROOT, 'dist', 'core', 'schematics', 'ng-add', 'schema.json'), 'utf8'));

    expect(Object.keys(schema.properties)).not.toContain('dryRun');
    expect(Object.keys(schema.properties)).not.toContain('interactive');
    expect(Object.keys(schema.properties)).not.toContain('verbose');
  });
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

  it('installs @cngx/core first and runs its ng-add as a task when core is missing', async () => {
    const runner = new SchematicTestRunner('@cngx/ui', UI_COLLECTION);
    const tree = await runner.runSchematic('ng-add', { preset: 'minimal' }, appTree);
    const manifest = JSON.parse(tree.readText('package.json'));
    const delegate = runner.tasks.find((task) => task.name === 'run-schematic');

    expect(manifest.dependencies['@cngx/core']).toBe(version);
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
// paid on every install. The budget leaves room for the onboarding steps on
// top of the bundled renderer and prompt libraries.
const MAX_MINIFIED = 200 * 1024;
const MAX_GZIP = 70 * 1024;
// A shim only adds core and delegates; it pulls nothing from the renderer
// or the prompts, which `sideEffects: false` on the source package lets
// esbuild drop.
const MAX_SHIM_MINIFIED = 20 * 1024;

function schematicEntries() {
  const dist = join(ROOT, 'dist');
  return readdirSync(dist, { withFileTypes: true })
    .filter((lib) => lib.isDirectory() && existsSync(join(dist, lib.name, 'schematics')))
    .flatMap((lib) =>
      readdirSync(join(dist, lib.name, 'schematics'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(lib.name, 'schematics', entry.name, 'index.js'))
        .filter((file) => existsSync(join(dist, file))),
    );
}

describe('schematic bundle budget', () => {
  it('finds the built entries', () => {
    expect(schematicEntries()).toEqual(expect.arrayContaining(['core/schematics/ng-add/index.js', 'ui/schematics/ng-add/index.js']));
  });

  it.each(schematicEntries())('keeps dist/%s under 200 KB minified and 70 KB gzip', (file) => {
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
