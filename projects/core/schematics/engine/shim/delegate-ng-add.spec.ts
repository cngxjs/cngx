import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { logging } from '@angular-devkit/core';
import { callRule, type Schematic, type SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { delegateNgAdd } from './delegate-ng-add';

const VERSION = '0.1.0';

function createRunner(): SchematicTestRunner {
  return new SchematicTestRunner(
    '@schematics/angular',
    join(dirname(require.resolve('@schematics/angular/package.json')), 'collection.json'),
  );
}

let shimBundle = '';

async function run(runner: SchematicTestRunner, contextOverrides: Partial<SchematicContext> = {}) {
  const logs: string[] = [];
  const logger = new logging.Logger('delegate-spec');
  logger.subscribe((entry) => logs.push(entry.message));
  const schematic = { description: { name: 'ng-add' } } as unknown as Schematic<object, object>;
  const context = runner.engine.createContext(schematic, { logger });
  const tasks: string[] = [];
  const recording: SchematicContext = {
    ...context,
    ...contextOverrides,
    addTask: (task, dependencies) => {
      tasks.push(task.toConfiguration().name);
      return context.addTask(task, dependencies);
    },
  };
  const tree = await lastValueFrom(
    callRule(delegateNgAdd({ preset: 'minimal' }, shimBundle), createMemoryTree({ 'package.json': '{ "dependencies": {} }\n' }), recording),
  );
  return { tree, tasks, logs };
}

describe('delegateNgAdd', () => {
  let fakeCore: string;

  beforeAll(() => {
    // A shim package at VERSION, and a stand-in @cngx/core collection whose
    // ng-add records the options it got.
    fakeCore = mkdtempSync(join(tmpdir(), 'cngx-fake-core-'));
    mkdirSync(join(fakeCore, 'shim', 'schematics', 'ng-add'), { recursive: true });
    writeFileSync(join(fakeCore, 'shim', 'package.json'), JSON.stringify({ version: VERSION }));
    shimBundle = join(fakeCore, 'shim', 'schematics', 'ng-add');
    writeFileSync(
      join(fakeCore, 'collection.json'),
      JSON.stringify({ schematics: { 'ng-add': { description: 'fake', factory: './index#ngAdd' } } }),
    );
    writeFileSync(
      join(fakeCore, 'index.js'),
      "exports.ngAdd = (options) => (tree) => { tree.create('delegated.json', JSON.stringify(options)); };\n",
    );
  });

  afterAll(() => {
    rmSync(fakeCore, { recursive: true, force: true });
  });

  it('pins core and delegates in the same run when core is resolvable', async () => {
    const runner = createRunner();
    runner.registerCollection('@cngx/core', join(fakeCore, 'collection.json'));

    const { tree, tasks } = await run(runner);

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe(VERSION);
    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ preset: 'minimal' });
    expect(tasks).toEqual([]);
  });

  it('installs core first and runs its ng-add as a follow-up task when core is not placed yet', async () => {
    const { tree, tasks, logs } = await run(createRunner());

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe(VERSION);
    expect(tree.exists('delegated.json')).toBe(false);
    expect(tasks).toEqual(['node-package', 'run-schematic']);
    expect(logs).toContain('@cngx/core is not installed yet; installing it before its ng-add runs.');
  });

  it('reports a core install whose collection fails to load instead of retrying', async () => {
    const runner = createRunner();
    const broken = {
      ...runner.engine,
      createCollection: () => {
        throw new Error('Unexpected token in collection.json');
      },
    } as unknown as SchematicContext['engine'];

    await expect(run(runner, { engine: broken })).rejects.toThrow(
      '@cngx/core is installed but its ng-add collection failed to load: Unexpected token in collection.json',
    );
  });
});
