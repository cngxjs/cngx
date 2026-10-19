import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';

/**
 * Compiles the `--preset full` starter the built ng-add writes over a fresh
 * `ng new` app, with the app's own strict tsconfig and `strictTemplates`,
 * against the `@cngx/*` packages in `dist/`. A renamed export, a changed
 * selector or input, or a type the starter template binds wrongly fails
 * here on every PR, not first in the nightly consumer run. Needs
 * `npm run build:libs`.
 *
 * The app is written into `.starter-compile/` under the repo root (ignored
 * by git and eslint, removed afterwards), so `@angular/*`, `tslib` and
 * `@floating-ui/dom` resolve from the root `node_modules`; `@cngx/*` resolve
 * through symlinks to `dist/`.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORK = join(ROOT, '.starter-compile');
const CORE_COLLECTION = join(ROOT, 'dist', 'core', 'schematics', 'collection.json');

// An in-process ngtsc run over the app and the @cngx typings takes longer
// than the 5 s vitest default.
const COMPILE_TIMEOUT = 120_000;

function requireDist(file) {
  if (!existsSync(file)) {
    throw new Error(`${file} is missing - run \`npm run build:libs\` first`);
  }
  return file;
}

async function createAppTree(runner, routing) {
  const workspace = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '21.2.0',
  });
  return runner.runExternalSchematic('@schematics/angular', 'application', { name: 'app', routing }, workspace);
}

// Every text file of the workspace the compile reads, written below `dir`
// at its own path, so the app's tsconfig finds the workspace one it extends.
function writeWorkspace(tree, dir) {
  for (const path of tree.files.filter((file) => /\.(ts|html|css|json)$/.test(file) && !file.startsWith('/node_modules/'))) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, tree.readText(path));
  }
}

async function compile(dir) {
  const { performCompilation, readConfiguration } = await import('@angular/compiler-cli');
  const config = readConfiguration(join(dir, 'tsconfig.app.json'));
  // Resolve @cngx/* through the symlinks, not their dist/ targets, so a
  // package's own @cngx imports find their siblings next to it.
  const options = { ...config.options, noEmit: true, preserveSymlinks: true };
  const { diagnostics } = performCompilation({ rootNames: config.rootNames, options });
  return diagnostics.map((diagnostic) => {
    const text = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText;
    const where = diagnostic.file ? `${diagnostic.file.fileName.replace(`${WORK}/`, '')}: ` : '';
    return `${where}TS${diagnostic.code}: ${text}`;
  });
}

const CASES = [
  { name: 'full, routing on', routing: true, flags: {} },
  { name: 'full, routing off', routing: false, flags: {} },
  { name: 'full with the runtime language switch, routing on', routing: true, flags: { i18n: 'de', runtimeSwitch: true } },
  { name: 'full with the runtime language switch, routing off', routing: false, flags: { i18n: 'de', runtimeSwitch: true } },
];

describe('the full preset starter', () => {
  let runner;

  beforeAll(() => {
    runner = new SchematicTestRunner('@cngx/core', requireDist(CORE_COLLECTION));
    rmSync(WORK, { recursive: true, force: true });
    mkdirSync(join(WORK, 'node_modules', '@cngx'), { recursive: true });
    for (const lib of PACKED_LIBS) {
      symlinkSync(join(ROOT, 'dist', lib), join(WORK, 'node_modules', '@cngx', lib), 'dir');
    }
  });

  afterAll(() => {
    rmSync(WORK, { recursive: true, force: true });
  });

  it.each(CASES)(
    'compiles with strict templates against dist/: $name',
    async ({ name, routing, flags }) => {
      const tree = await runner.runSchematic(
        'ng-add',
        { preset: 'full', yes: true, prompts: false, ...flags },
        await createAppTree(runner, routing),
      );
      const app = tree.readText('/projects/app/src/app/app.ts');
      const template = tree.readText('/projects/app/src/app/app.html');
      expect(app).toMatch(/^\/\* cngx:fingerprint [0-9a-f]{8} \*\//);
      expect(app.includes('RouterOutlet')).toBe(routing);
      expect(template.includes('cngx-button-toggle-group')).toBe(flags.runtimeSwitch === true);

      const dir = join(WORK, name.replace(/[^a-z]+/gi, '-'));
      writeWorkspace(tree, dir);

      expect(await compile(join(dir, 'projects', 'app'))).toEqual([]);
    },
    COMPILE_TIMEOUT,
  );

  // The controls: the same compile reports a binding the starter's
  // components do not have, and an export @cngx/ui does not ship. Each runs
  // alone, since ngtsc checks templates only once the TypeScript is clean.
  it.each([
    ['a renamed input', 'app.html', (text) => text.replace('scope="starter"', '[scopeRenamed]="1"'), 'scopeRenamed'],
    ['a renamed export', 'app.ts', (text) => text.replaceAll('CngxA11yPanel', 'CngxA11yPanelRenamed'), 'CngxA11yPanelRenamed'],
  ])(
    'reports %s',
    async (name, file, edit, needle) => {
      const tree = await runner.runSchematic('ng-add', { preset: 'full', yes: true, prompts: false }, await createAppTree(runner, true));
      const dir = join(WORK, `control-${name.replace(/[^a-z]+/gi, '-')}`);
      writeWorkspace(tree, dir);
      writeFileSync(join(dir, 'projects', 'app', 'src', 'app', file), edit(tree.readText(`/projects/app/src/app/${file}`)));

      const diagnostics = await compile(join(dir, 'projects', 'app'));

      expect(diagnostics.filter((line) => line.includes(needle))).not.toEqual([]);
    },
    COMPILE_TIMEOUT,
  );
});
