import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Smoke guard for the bundled schematics under dist/. Runs the built
 * collection, not the sources, so it proves the esbuild bundle resolves its
 * externals and the collection wiring the CLI will load. Needs
 * `npm run build:libs` (CI downloads the build output before this job).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORE_COLLECTION = join(ROOT, 'dist', 'core', 'schematics', 'collection.json');

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

  it('ng-add installs once and chains ng-add-setup after the install', async () => {
    await runner.runSchematic('ng-add', { preset: 'minimal' }, appTree);
    // The test runner records task configurations without their dependency
    // ids, so the scheduling order stands in for the install -> setup edge.
    const names = runner.tasks.map((task) => task.name);
    const setup = runner.tasks.find((task) => task.name === 'run-schematic');

    expect(names).toEqual(['node-package', 'run-schematic']);
    expect(setup.options).toMatchObject({ name: 'ng-add-setup', options: { preset: 'minimal' } });
  });

  it('ng-add-setup writes the spike file without prompting when not interactive', async () => {
    const tree = await runner.runSchematic('ng-add-setup', { interactive: false }, appTree);
    const spike = JSON.parse(tree.readText('.cngx/spike.json'));

    expect(spike.theme).toBe('cngx');
    expect(spike.facts).toMatchObject({ projects: ['app'], interactive: false, material: false });
  });
});
