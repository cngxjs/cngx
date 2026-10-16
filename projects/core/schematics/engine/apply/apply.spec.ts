import { dirname, join } from 'node:path';

import { type Tree } from '@angular-devkit/schematics';
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

  it.each([
    ['edit-file', { kind: 'edit-file', edit: (content: string) => content }],
    ['add-style-import', { kind: 'add-style-import', statement: "@import '@cngx/themes/cngx.css';" }],
  ] as const)('names a planned %s target that does not exist', async (_kind, change) => {
    await expect(
      apply([{ ...BASE, ...change, id: 'm', label: 'Import cngx.css', path: 'src/missing.css' }]),
    ).rejects.toThrow('src/missing.css is planned for Import cngx.css but does not exist.');
  });

  it('edits a file through its pure transform', async () => {
    const tree = await apply(
      [{ ...BASE, kind: 'edit-file', id: 'e', path: 'a.txt', edit: (content) => content.toUpperCase() }],
      createMemoryTree({ 'a.txt': 'abc\n' }),
    );

    expect(tree.readText('a.txt')).toBe('ABC\n');
  });

  it('refuses a change kind it has no mapping for', () => {
    const unknown = { ...BASE, kind: 'unknown-kind', id: 'i', path: 'main.ts' } as unknown as Change;

    expect(() => applyChangePlan(createChangePlan([{ changes: [unknown], skipped: [] }]))).toThrow(
      'No apply mapping for change',
    );
  });

  it('adds a lockstep dependency', async () => {
    const tree = await apply(
      [{ ...BASE, kind: 'add-dependency', id: 'd', name: '@cngx/core', version: '0.1.0' }],
      createMemoryTree({ 'package.json': '{ "dependencies": {} }\n' }),
    );

    expect(JSON.parse(tree.readText('package.json')).dependencies['@cngx/core']).toBe('0.1.0');
  });

  it('keeps the trailing newline of package.json for a dev dependency, and adds none it did not have', async () => {
    const change: Change = { ...BASE, kind: 'add-dependency', id: 'd', name: '@cngx/eslint-plugin', version: '0.2.0', dev: true };
    const ended = await apply([change], createMemoryTree({ 'package.json': '{\n  "devDependencies": {}\n}\n' }));
    const bare = await apply([change], createMemoryTree({ 'package.json': '{\n  "devDependencies": {}\n}' }));

    expect(ended.readText('package.json')).toBe('{\n  "devDependencies": {\n    "@cngx/eslint-plugin": "0.2.0"\n  }\n}\n');
    expect(bare.readText('package.json')).toBe('{\n  "devDependencies": {\n    "@cngx/eslint-plugin": "0.2.0"\n  }\n}');
  });

  it('adds a dev dependency off the lockstep and keeps an existing range', async () => {
    const change: Change = { ...BASE, kind: 'add-dependency', id: 'd', name: '@cngx/eslint-plugin', version: '0.2.0', dev: true };
    const added = await apply([change], createMemoryTree({ 'package.json': '{ "devDependencies": {} }\n' }));
    const kept = await apply(
      [change],
      createMemoryTree({ 'package.json': '{ "devDependencies": { "@cngx/eslint-plugin": "^0.1.0" } }\n' }),
    );

    expect(JSON.parse(added.readText('package.json')).devDependencies['@cngx/eslint-plugin']).toBe('0.2.0');
    expect(JSON.parse(kept.readText('package.json')).devDependencies['@cngx/eslint-plugin']).toBe('^0.1.0');
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

  it('puts the provider on its own line in a multi-line providers array, callee first in its imports', async () => {
    const config = `import { ApplicationConfig } from '@angular/core';
import { TitleStrategy } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
`;
    const change: Change = {
      ...BASE,
      kind: 'add-provider',
      id: 'p',
      project: 'app',
      path: 'src/app/app.config.ts',
      call: {
        symbol: 'provideA11yPreferences',
        module: '@cngx/core',
        args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
      },
    };
    const tree = await apply([change, change], createMemoryTree({ 'src/app/app.config.ts': config }));

    expect(tree.readText('src/app/app.config.ts')).toBe(`import { ApplicationConfig } from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { provideA11yPreferences, withPersistence } from '@cngx/core';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideA11yPreferences(withPersistence()),
  ],
};
`);
  });

  describe('falls back to addRootProvider', () => {
    const CONFIG_PATH = 'projects/app/src/app/app.config.ts';
    const PERSISTENCE: Change = {
      ...BASE,
      kind: 'add-provider',
      id: 'p',
      project: 'app',
      path: CONFIG_PATH,
      call: {
        symbol: 'provideA11yPreferences',
        module: '@cngx/core',
        args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
      },
    };

    it('when a name the call imports is already bound to another module', async () => {
      const tree = await createApp();
      tree.overwrite(
        CONFIG_PATH,
        `import { ApplicationConfig } from '@angular/core';
import { withPersistence } from './storage';

export const appConfig: ApplicationConfig = {
  providers: [
    withPersistence(),
  ],
};
`,
      );

      const config = (await apply([PERSISTENCE], tree)).readText(CONFIG_PATH);

      expect(config).toContain("import { withPersistence } from './storage';");
      expect(config).toContain(
        "import { provideA11yPreferences, withPersistence as withPersistence_alias } from '@cngx/core';",
      );
      expect(config).toContain('provideA11yPreferences(withPersistence_alias())');
    });

    it('when the file holds more than one root providers array', async () => {
      const tree = await createApp();
      tree.overwrite(
        CONFIG_PATH,
        `import { ApplicationConfig } from '@angular/core';

export const serverConfig: ApplicationConfig = { providers: [] };

export const appConfig: ApplicationConfig = {
  providers: [
    serverConfig.providers,
  ],
};
`,
      );

      const config = (await apply([PERSISTENCE], tree)).readText(CONFIG_PATH);

      expect(config).toContain('export const serverConfig: ApplicationConfig = { providers: [] };');
      expect(config).toContain("import { provideA11yPreferences, withPersistence } from '@cngx/core';");
      expect(config).toContain('    serverConfig.providers, provideA11yPreferences(withPersistence()),\n');
    });

    it('when the planned file does not exist', async () => {
      const tree = await createApp();

      const config = (await apply([{ ...PERSISTENCE, path: 'projects/app/src/app/missing.ts' }], tree)).readText(CONFIG_PATH);

      expect(config).toContain('provideA11yPreferences(withPersistence())');
      expect(tree.exists('projects/app/src/app/missing.ts')).toBe(false);
    });
  });

  describe('edits the root providers array in place', () => {
    const PATH = 'src/app/app.config.ts';
    const PERSISTENCE: Change = {
      ...BASE,
      kind: 'add-provider',
      id: 'p',
      project: 'app',
      path: PATH,
      call: {
        symbol: 'provideA11yPreferences',
        module: '@cngx/core',
        args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
      },
    };

    async function edited(config: string): Promise<string> {
      return (await apply([PERSISTENCE], createMemoryTree({ [PATH]: config }))).readText(PATH);
    }

    it('past a route-level providers array', async () => {
      const config = await edited(`import { ApplicationConfig } from '@angular/core';

const routes: Routes = [{ path: 'admin', providers: [provideAdmin()] }];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
  ],
};
`);

      expect(config).toContain("{ path: 'admin', providers: [provideAdmin()] }");
      expect(config).toContain('    provideRouter(routes),\n    provideA11yPreferences(withPersistence()),\n  ],');
    });

    it('fills an empty array', async () => {
      const config = await edited(
        "import { ApplicationConfig } from '@angular/core';\n\nexport const appConfig: ApplicationConfig = { providers: [] };\n",
      );

      expect(config).toContain('{ providers: [provideA11yPreferences(withPersistence())] }');
    });

    it('promotes a type-only import of the same name from the same module', async () => {
      const config = await edited(`import type { CngxA11yAxes, withPersistence } from '@cngx/core';

export const appConfig: ApplicationConfig = {
  providers: [],
};
`);

      expect(config).toContain("import { type CngxA11yAxes, withPersistence, provideA11yPreferences } from '@cngx/core';");
      expect(config).toContain('providers: [provideA11yPreferences(withPersistence())]');
    });

    it('adds to an import of the same module', async () => {
      const config = await edited(`import { withPersistence } from '@cngx/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
  ],
};
`);

      expect(config).toContain("import { withPersistence, provideA11yPreferences } from '@cngx/core';");
      expect(config).toContain('    provideA11yPreferences(withPersistence()),\n');
    });
  });

  it('renders a reference argument as a bare identifier', async () => {
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'add-provider',
          id: 'p',
          project: 'app',
          call: {
            symbol: 'provideCngxI18n',
            module: '@cngx/core/i18n',
            args: [
              {
                symbol: 'withPack',
                module: '@cngx/core/i18n',
                args: [{ symbol: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de', reference: true }],
              },
            ],
          },
        },
      ],
      await createApp(),
    );
    const config = tree.readText('projects/app/src/app/app.config.ts');

    expect(config).toContain('provideCngxI18n(withPack(CNGX_LANGUAGE_DE))');
    expect(config).toContain("import { CNGX_LANGUAGE_DE } from '@cngx/core/i18n/de';");
  });

  it('renders an array argument and imports every call inside it', async () => {
    const floating = (symbol: string) => ({ symbol, module: '@floating-ui/dom' });
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'add-provider',
          id: 'p',
          project: 'app',
          call: {
            symbol: 'provideFloatingFallback',
            module: '@cngx/common/popover',
            args: [{ ...floating('computePosition'), reference: true }, { array: [floating('flip'), floating('shift')] }],
          },
        },
      ],
      await createApp(),
    );
    const config = tree.readText('projects/app/src/app/app.config.ts');

    expect(config).toContain('provideFloatingFallback(computePosition, [flip(), shift()])');
    expect(config).toMatch(/import \{ [^}]*\bcomputePosition\b[^}]*\bflip\b[^}]*\bshift\b[^}]* \} from '@floating-ui\/dom';/);
  });

  it('writes a literal argument as is and imports nothing for it', async () => {
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'add-provider',
          id: 'p',
          project: 'app',
          call: { symbol: 'provideDirection', module: '@cngx/core', args: [{ literal: "'rtl'" }] },
        },
      ],
      await createApp(),
    );
    const config = tree.readText('projects/app/src/app/app.config.ts');

    expect(config).toContain("provideDirection('rtl')");
    expect(config).toContain("import { provideDirection } from '@cngx/core';");
  });

  it('places a style import before the first rule', async () => {
    const tree = await apply(
      [
        {
          ...BASE,
          kind: 'add-style-import',
          id: 's',
          path: 'src/styles.scss',
          statement: "@import '@cngx/themes/cngx.css';",
        },
      ],
      createMemoryTree({ 'src/styles.scss': "@use '@angular/material' as mat;\nhtml {}\n" }),
    );

    expect(tree.readText('src/styles.scss')).toBe(
      "@use '@angular/material' as mat;\n@import '@cngx/themes/cngx.css';\nhtml {}\n",
    );
  });

  describe('add-style-entry', () => {
    function styles(tree: Tree): unknown {
      const workspace = JSON.parse(tree.readText('angular.json')) as {
        projects: Record<string, { architect: { build: { options: { styles: unknown } } } }>;
      };
      return workspace.projects['app'].architect.build.options.styles;
    }

    function entry(path: string, after?: string): Change {
      return { ...BASE, kind: 'add-style-entry', id: 'e', project: 'app', path, after };
    }

    it('inserts the entry right after the named one', async () => {
      const seeded = await apply([entry('projects/app/src/material-theme.scss')], await createApp());
      const tree = await apply([entry('projects/app/src/cngx-theme.scss', 'projects/app/src/styles.css')], seeded);

      expect(styles(tree)).toEqual([
        'projects/app/src/styles.css',
        'projects/app/src/cngx-theme.scss',
        'projects/app/src/material-theme.scss',
      ]);
    });

    it('appends when the named entry is absent and adds an entry once', async () => {
      const once = await apply([entry('projects/app/src/cngx-theme.css', 'src/missing.css')], await createApp());
      const twice = await apply([entry('projects/app/src/cngx-theme.css')], once);

      expect(styles(twice)).toEqual(['projects/app/src/styles.css', 'projects/app/src/cngx-theme.css']);
    });

    it('refuses a project without a build target', async () => {
      await expect(apply([{ ...entry('a.css'), project: 'missing' } as Change], await createApp())).rejects.toThrow(
        'Project "missing" has no build target to add a.css to.',
      );
    });
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
