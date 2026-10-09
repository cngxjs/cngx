import { dirname, join } from 'node:path';

import { SchematicTestRunner, type UnitTestTree } from '@angular-devkit/schematics/testing';
import { lastValueFrom } from 'rxjs';
import { beforeAll, describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { type Change } from '../plan/change';
import { createChangePlan } from '../plan/plan';
import { applyChangePlan } from './apply';

const PROVENANCE = { source: 'apply-spec', version: '0.1.0' } as const;
const BASE = { label: 'label', reason: 'reason', provenance: PROVENANCE } as const;

const runner = new SchematicTestRunner(
  '@schematics/angular',
  join(dirname(require.resolve('@schematics/angular/package.json')), 'collection.json'),
);

async function createApp(): Promise<UnitTestTree> {
  const workspace = await runner.runSchematic('workspace', {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '21.2.0',
  });
  return runner.runSchematic('application', { name: 'app', standalone: true }, workspace);
}

async function apply(changes: readonly Change[], tree = createMemoryTree()) {
  return lastValueFrom(runner.callRule(applyChangePlan(createChangePlan([{ changes, skipped: [] }])), tree));
}

describe('applyChangePlan', () => {
  let app: UnitTestTree;

  beforeAll(async () => {
    app = await createApp();
  });

  it('creates a file', async () => {
    const tree = await apply([{ ...BASE, kind: 'create-file', id: 'c', path: '.cngx/README.md', content: '# cngx\n' }]);

    expect(tree.readText('.cngx/README.md')).toBe('# cngx\n');
  });

  it('refuses to overwrite an existing file through create-file', async () => {
    const existing = createMemoryTree({ '.cngx/README.md': 'mine\n' });

    await expect(
      apply([{ ...BASE, kind: 'create-file', id: 'c', path: '.cngx/README.md', content: '# cngx\n' }], existing),
    ).rejects.toThrow('.cngx/README.md already exists; cngx does not overwrite it.');
  });

  it('edits a file through its pure transform', async () => {
    const tree = await apply(
      [{ ...BASE, kind: 'edit-file', id: 'e', path: 'a.txt', edit: (content) => content.toUpperCase() }],
      createMemoryTree({ 'a.txt': 'abc\n' }),
    );

    expect(tree.readText('a.txt')).toBe('ABC\n');
  });

  it('adds an import once', async () => {
    const change: Change = {
      ...BASE,
      kind: 'add-import',
      id: 'i',
      path: 'main.ts',
      symbol: 'provideA11yPreferences',
      module: '@cngx/core',
    };
    const tree = await apply([change, change], createMemoryTree({ 'main.ts': "import { x } from 'x';\n" }));

    expect(tree.readText('main.ts')).toBe(
      "import { x } from 'x';\nimport { provideA11yPreferences } from '@cngx/core';\n",
    );
  });

  it('adds a lockstep dependency', async () => {
    const tree = await apply(
      [{ ...BASE, kind: 'add-dependency', id: 'd', name: '@cngx/core', version: '0.1.0' }],
      createMemoryTree({ 'package.json': '{ "dependencies": {} }\n' }),
    );

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe('0.1.0');
  });

  it('adds a nested provider call with its imports to app.config.ts', async () => {
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'add-provider',
          id: 'p',
          project: 'app',
          call: {
            symbol: 'provideA11yPreferences',
            module: '@cngx/core',
            args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
          },
        },
      ],
      app,
    );
    const config = tree.readText('projects/app/src/app/app.config.ts');

    expect(config).toContain('provideA11yPreferences(withPersistence())');
    expect(config).toMatch(/import \{ [^}]*\bprovideA11yPreferences\b[^}]* \} from '@cngx\/core';/);
    expect(config).toMatch(/import \{ [^}]*\bwithPersistence\b[^}]* \} from '@cngx\/core';/);
  });

  it('writes json entries and creates the file when missing', async () => {
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'write-json',
          id: 'j',
          path: '.mcp.json',
          entries: [[['mcpServers', 'cngx'], { command: 'npx', args: ['-y', '@cngx/mcp@0.1.0'] }]],
        },
      ],
      createMemoryTree(),
    );

    expect(JSON.parse(tree.readText('.mcp.json'))).toEqual({
      mcpServers: { cngx: { command: 'npx', args: ['-y', '@cngx/mcp@0.1.0'] } },
    });
  });

  it('keeps existing json keys', async () => {
    const tree = await apply(
      [{ ...BASE, kind: 'write-json', id: 'j', path: '.mcp.json', entries: [[['mcpServers', 'cngx'], {}]] }],
      createMemoryTree({ '.mcp.json': '{ "mcpServers": { "other": {} } }\n' }),
    );

    expect(Object.keys(JSON.parse(tree.readText('.mcp.json')).mcpServers)).toEqual(['other', 'cngx']);
  });

  it('touches no file for a note', async () => {
    const seed = createMemoryTree({ 'a.txt': 'a' });
    const tree = await apply([{ ...BASE, kind: 'note', id: 'n' }], seed);

    expect(tree.actions).toEqual([]);
  });
});
