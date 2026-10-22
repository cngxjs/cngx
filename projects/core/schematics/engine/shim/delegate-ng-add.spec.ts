import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { logging } from '@angular-devkit/core';
import { callRule, type Schematic, type SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { type NgAddFlags } from '../options';
import { delegateNgAdd } from './delegate-ng-add';

const VERSION = '0.1.0';

function createRunner(): SchematicTestRunner {
  return new SchematicTestRunner(
    '@schematics/angular',
    join(dirname(require.resolve('@schematics/angular/package.json')), 'collection.json'),
  );
}

let shimBundle = '';
let themesBundle = '';
let utilsBundle = '';
let unstampedBundle = '';

interface RunOptions {
  readonly flags?: NgAddFlags;
  readonly bundle?: string;
  readonly contextOverrides?: Partial<SchematicContext>;
  /** The @cngx/core version the package manager placed; none when omitted. */
  readonly installed?: string;
  /** The app's package.json; no dependencies when omitted. */
  readonly manifest?: string;
  /** Extra files, e.g. an installed `node_modules/@angular/core/package.json`. */
  readonly files?: Readonly<Record<string, string>>;
}

async function run(
  runner: SchematicTestRunner,
  { flags = { preset: 'minimal' }, bundle = shimBundle, contextOverrides = {}, installed, manifest, files = {} }: RunOptions = {},
) {
  const logs: string[] = [];
  const logger = new logging.Logger('delegate-spec');
  logger.subscribe((entry) => logs.push(entry.message));
  const schematic = { description: { name: 'ng-add' } } as unknown as Schematic<object, object>;
  const context = runner.engine.createContext(schematic, { logger });
  const tasks: string[] = [];
  const taskOptions: unknown[] = [];
  const recording: SchematicContext = {
    ...context,
    ...contextOverrides,
    addTask: (task, dependencies) => {
      const configuration = task.toConfiguration();
      tasks.push(configuration.name);
      taskOptions.push(configuration.options);
      return context.addTask(task, dependencies);
    },
  };
  const tree = await lastValueFrom(
    callRule(
      delegateNgAdd(flags, bundle),
      createMemoryTree({
        'package.json': manifest ?? '{ "dependencies": {} }\n',
        ...files,
        ...(installed === undefined
          ? {}
          : { 'node_modules/@cngx/core/package.json': JSON.stringify({ name: '@cngx/core', version: installed }) }),
      }),
      recording,
    ),
  );
  return { tree, tasks, taskOptions, logs };
}

function writeShim(root: string, name: string, version = VERSION, folder = name): string {
  mkdirSync(join(root, folder, 'schematics', 'ng-add'), { recursive: true });
  writeFileSync(join(root, folder, 'package.json'), JSON.stringify({ name: `@cngx/${name}`, version }));
  return join(root, folder, 'schematics', 'ng-add');
}

describe('delegateNgAdd', () => {
  let fakeCore: string;

  beforeAll(() => {
    // A shim package at VERSION, and a stand-in @cngx/core collection whose
    // ng-add records the options it got.
    fakeCore = mkdtempSync(join(tmpdir(), 'cngx-fake-core-'));
    shimBundle = writeShim(fakeCore, 'forms');
    themesBundle = writeShim(fakeCore, 'themes');
    utilsBundle = writeShim(fakeCore, 'utils');
    unstampedBundle = writeShim(fakeCore, 'forms', '0.0.0-PLACEHOLDER', 'unstamped');
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

  function resolvingRunner(): SchematicTestRunner {
    const runner = createRunner();
    runner.registerCollection('@cngx/core', join(fakeCore, 'collection.json'));
    return runner;
  }

  it('hands its pins to core and writes nothing itself when the installed core is the shim version', async () => {
    const manifest = '{ "dependencies": { "@cngx/core": "^0.1.0" } }\n';
    const { tree, tasks } = await run(resolvingRunner(), { installed: VERSION, manifest });

    // The stand-in core writes no package.json, as a declined confirm leaves it.
    expect(tree.readText('package.json')).toBe(manifest);
    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ preset: 'minimal', pins: ['@cngx/core', '@cngx/forms'] });
    expect(tasks).toEqual([]);
  });

  it('pins nothing from an unstamped local build and follows the installed core', async () => {
    const { tree, tasks, logs } = await run(resolvingRunner(), { bundle: unstampedBundle, installed: VERSION });

    expect(JSON.parse(tree.readText('package.json')).dependencies).toEqual({});
    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ preset: 'minimal' });
    expect(tasks).toEqual([]);
    expect(logs).toContain(
      '@cngx/forms is an unstamped local build (0.0.0-PLACEHOLDER); pinning nothing and following the installed @cngx/core 0.1.0.',
    );
  });

  it('stops an unstamped local build when no core is installed', async () => {
    await expect(run(createRunner(), { bundle: unstampedBundle })).rejects.toThrow(
      '@cngx/forms is an unstamped local build (0.0.0-PLACEHOLDER) and @cngx/core is not installed; pack the libs with node scripts/pack-libs.mjs and install the tarballs.',
    );
  });

  it('installs core first and runs its ng-add as a follow-up task when core is not placed yet', async () => {
    const { tree, tasks, logs } = await run(createRunner());

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe(VERSION);
    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/forms']).toBe(VERSION);
    expect(tree.readText('package.json').endsWith('}\n')).toBe(true);
    expect(tree.exists('delegated.json')).toBe(false);
    expect(tasks).toEqual(['node-package', 'run-schematic']);
    expect(logs).toContain('@cngx/core is not installed yet; installing it before its ng-add runs.');
  });

  it('installs the shim core in the same run over an older installed core, without loading it', async () => {
    const runner = resolvingRunner();
    let loaded = false;
    const watching = {
      ...runner.engine,
      createCollection: (...args: Parameters<SchematicContext['engine']['createCollection']>) => {
        loaded = true;
        return runner.engine.createCollection(...args);
      },
    } as unknown as SchematicContext['engine'];
    const { tree, tasks, taskOptions, logs } = await run(runner, { installed: '0.0.9', contextOverrides: { engine: watching } });

    expect(loaded).toBe(false);
    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe(VERSION);
    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/forms']).toBe(VERSION);
    expect(tree.exists('delegated.json')).toBe(false);
    expect(tasks).toEqual(['node-package', 'run-schematic']);
    expect(taskOptions[1]).toMatchObject({ collection: '@cngx/core', name: 'ng-add' });
    expect(logs).toContain(`@cngx/core 0.0.9 is installed, older than @cngx/forms ${VERSION}; installing ${VERSION} before its ng-add runs.`);
  });

  it('follows a newer installed core without pinning anything', async () => {
    const { tree, tasks, logs } = await run(resolvingRunner(), { installed: '0.2.0' });

    expect(JSON.parse(tree.readText('package.json')).dependencies).toEqual({});
    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ preset: 'minimal' });
    expect(tasks).toEqual([]);
    expect(logs).toContain(`@cngx/core 0.2.0 is installed, newer than @cngx/forms ${VERSION}; following the installed core.`);
  });

  it('writes its line to the terminal at the left edge instead of the indenting logger', async () => {
    vi.stubEnv('NG_FORCE_TTY', '1');
    const written: string[] = [];
    const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      written.push(String(chunk));
      return true;
    });
    try {
      const { logs } = await run(resolvingRunner(), { installed: '0.2.0' });

      expect(written).toContain(`@cngx/core 0.2.0 is installed, newer than @cngx/forms ${VERSION}; following the installed core.\n`);
      expect(logs).not.toContain(`@cngx/core 0.2.0 is installed, newer than @cngx/forms ${VERSION}; following the installed core.`);
    } finally {
      write.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it('reads a prerelease of the shim version as older', async () => {
    const { tasks } = await run(resolvingRunner(), { installed: `${VERSION}-rc.8` });

    expect(tasks).toEqual(['node-package', 'run-schematic']);
  });

  it('reports a core install whose collection fails to load instead of retrying', async () => {
    const runner = createRunner();
    const broken = {
      ...runner.engine,
      createCollection: () => {
        throw new Error('Unexpected token in collection.json');
      },
    } as unknown as SchematicContext['engine'];

    await expect(run(runner, { installed: VERSION, contextOverrides: { engine: broken } })).rejects.toThrow(
      '@cngx/core is installed but its ng-add collection failed to load: Unexpected token in collection.json',
    );
  });

  it.each([
    ['a comma list', 'core'],
    ['a list', ['core']],
  ])('adds its own package to the libs given as %s', async (_form, libs) => {
    const { tree } = await run(resolvingRunner(), { installed: VERSION, flags: { libs } });

    expect(JSON.parse(tree.readText('delegated.json'))).toMatchObject({ libs: ['core', 'forms'] });
  });

  describe('the CDK its packages peer on', () => {
    const app = (deps: Record<string, string>) => `${JSON.stringify({ dependencies: deps })}\n`;
    const dependencies = (tree: { readText(path: string): string }) =>
      JSON.parse(tree.readText('package.json')).dependencies as Record<string, string>;

    it.each([
      ['an Angular 21 app', '^21.2.0'],
      ['an Angular 22 app', '^22.1.0'],
    ])('declares the CDK at the range of %s before its install', async (_label, angular) => {
      const { tree, tasks, logs } = await run(createRunner(), { manifest: app({ '@angular/core': angular }) });

      expect(dependencies(tree)['@angular/cdk']).toBe(angular);
      expect(tasks).toEqual(['node-package', 'run-schematic']);
      expect(logs).toContain(
        `Adding @angular/cdk@${angular} to match @angular/core, so the install does not pick the @angular/cdk of a newer Angular.`,
      );
    });

    it('keeps a CDK the app already declares at any range', async () => {
      const { tree, logs } = await run(createRunner(), {
        manifest: app({ '@angular/core': '^21.2.0', '@angular/cdk': '~21.1.4' }),
      });

      expect(dependencies(tree)['@angular/cdk']).toBe('~21.1.4');
      expect(logs.some((line) => line.startsWith('Adding @angular/cdk'))).toBe(false);
    });

    it('matches the installed Angular behind a specifier that carries no version', async () => {
      const { tree } = await run(createRunner(), {
        manifest: app({ '@angular/core': 'catalog:' }),
        files: { 'node_modules/@angular/core/package.json': JSON.stringify({ name: '@angular/core', version: '22.2.3' }) },
      });

      expect(dependencies(tree)['@angular/cdk']).toBe('^22.2.0');
    });

    it('says what to add when no Angular version can be read', async () => {
      const { tree, logs } = await run(createRunner(), { manifest: app({ '@angular/core': 'workspace:*' }) });

      expect(dependencies(tree)['@angular/cdk']).toBeUndefined();
      expect(logs).toContain('Add @angular/cdk matching your @angular/core yourself; cngx cannot read an Angular version to match it to.');
    });

    it('adds no CDK for @cngx/utils, which does not peer on it', async () => {
      const { tree } = await run(createRunner(), { bundle: utilsBundle, manifest: app({ '@angular/core': '^21.2.0' }) });

      expect(dependencies(tree)['@angular/cdk']).toBeUndefined();
    });

    it('leaves the CDK to core when it delegates in the same run', async () => {
      const { tree } = await run(resolvingRunner(), { installed: VERSION, manifest: app({ '@angular/core': '^21.2.0' }) });

      expect(dependencies(tree)['@angular/cdk']).toBeUndefined();
    });
  });

  it('keeps the libs in package order and names each once', async () => {
    const { tree } = await run(resolvingRunner(), { installed: VERSION, flags: { libs: 'ui,forms,core' } });

    expect(JSON.parse(tree.readText('delegated.json'))).toMatchObject({ libs: ['core', 'forms', 'ui'] });
  });

  it('forwards no libs when the flag is not given', async () => {
    const { tree } = await run(resolvingRunner(), { installed: VERSION, flags: {} });

    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ pins: ['@cngx/core', '@cngx/forms'] });
  });

  it('adds its own package to the libs of the follow-up ng-add', async () => {
    const { taskOptions } = await run(createRunner(), { flags: { libs: 'core' } });

    expect(taskOptions[1]).toMatchObject({ options: { libs: ['core', 'forms'] } });
  });

  it('hands @cngx/themes to core to pin but leaves libs to the theme answer', async () => {
    const { tree } = await run(resolvingRunner(), { installed: VERSION, flags: { libs: 'core' }, bundle: themesBundle });

    expect(JSON.parse(tree.readText('delegated.json'))).toEqual({ libs: 'core', pins: ['@cngx/core', '@cngx/themes'] });
  });
});
