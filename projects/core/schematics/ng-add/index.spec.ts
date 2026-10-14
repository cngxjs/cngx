import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_TOOLS,
  CNGX_LIBS,
  DEFAULT_ESLINT_PLUGIN_VERSION,
  LANGUAGES,
  NG_ADD_PRESETS,
  THEME_CHOICES,
} from '../engine';
import { createFixtureTree, readFixture, runRule } from '../testing/run-schematic';
import { ngAdd } from './index';

// Specs run the source rule, so the version is core's source manifest.
const VERSION = (
  JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
    version: string;
  }
).version;

const COLLECTION = JSON.parse(readFileSync(join(__dirname, '..', 'collection.json'), 'utf8')) as {
  schematics: Record<string, unknown>;
};
const SCHEMA = JSON.parse(readFileSync(join(__dirname, 'schema.json'), 'utf8')) as {
  properties: Record<string, unknown>;
};

type Tree = ReturnType<typeof createFixtureTree>;

// The terminal side of an interactive run: every question keeps its
// preselection or default, the AI tooling question answers `editorPicks`.
// The git state is fixed, so the checklist does not follow the worktree.
const terminal = vi.hoisted(() => ({ editorPicks: [] as string[], git: 'clean' }));

vi.mock('./shell/git-state', () => ({ readGitState: () => terminal.git }));

vi.mock('@inquirer/checkbox', () => ({
  default: (question: { message: string; choices: { value: string; checked?: boolean }[] }) =>
    Promise.resolve(
      question.message.includes('MCP server')
        ? terminal.editorPicks
        : question.choices
            .filter((choice) => choice.checked === true)
            .map((choice) => choice.value),
    ),
}));
vi.mock('@inquirer/select', () => ({
  default: (question: { default: string }) => Promise.resolve(question.default),
}));
vi.mock('@inquirer/confirm', () => ({
  default: (question: { default: boolean }) => Promise.resolve(question.default),
}));

const MAP_API_THEME = `@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: -2,
  ));
}
`;

const DEFINE_THEME = `@use '@angular/material' as mat;

$theme: mat.define-theme((color: (theme-type: light, primary: mat.$violet-palette)));

html {
  @include mat.all-component-themes($theme);
}
`;

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {
  
})
  .catch(err => console.error(err));
`;

const APP_MODULE = `import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
`;

const ESLINT_CONFIG = `// @ts-check
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
  },
]);
`;

const SECOND_COMPONENT = `import { Component } from '@angular/core';

@Component({ selector: 'app-other', template: '' })
export class Other {}
`;

// The head of what `ng new --ai-config` writes into each rules file (@schematics/angular 21.2).
const ANGULAR_AI_RULES = `
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
`;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function json<T>(tree: Tree, path: string): T {
  return JSON.parse(tree.readContent(path)) as T;
}

function withWorkspace(edit: (project: Record<string, any>) => void): string {
  const workspace = JSON.parse(readFixture('standalone-app')['angular.json']) as {
    projects: Record<string, Record<string, any>>;
  };
  edit(workspace.projects['fixture-app']);
  return JSON.stringify(workspace, null, 2);
}

function withDependencies(dependencies: Record<string, string>): string {
  const manifest = JSON.parse(readFixture('standalone-app')['package.json']) as Record<string, any>;
  manifest['dependencies'] = { ...manifest['dependencies'], ...dependencies };
  return JSON.stringify(manifest, null, 2);
}

function withDevDependencies(devDependencies: Record<string, string>): string {
  const manifest = JSON.parse(readFixture('standalone-app')['package.json']) as Record<string, any>;
  manifest['devDependencies'] = { ...manifest['devDependencies'], ...devDependencies };
  return JSON.stringify(manifest, null, 2);
}

// What `ng add angular-eslint` leaves behind: a flat config and the three packages.
const ESLINT_APP = {
  'eslint.config.js': ESLINT_CONFIG,
  'package.json': withDevDependencies({ 'angular-eslint': '21.3.0', eslint: '^9.39.0', 'typescript-eslint': '8.56.1' }),
};

function styles(tree: Tree): unknown {
  return json<{ projects: Record<string, any> }>(tree, 'angular.json').projects['fixture-app'].architect.build.options
    .styles;
}

const MATERIAL_CSS_APP = {
  'package.json': withDependencies({ '@angular/material': '^21.2.0', '@angular/cdk': '^21.2.0' }),
  'angular.json': withWorkspace((project) => {
    project['architect'].build.options.styles = ['src/material-theme.scss', 'src/styles.css'];
  }),
  'src/material-theme.scss': MAP_API_THEME,
};

const DEFINE_THEME_SCSS_APP = {
  'package.json': withDependencies({ '@angular/material': '^21.2.0', '@angular/cdk': '^21.2.0' }),
  'angular.json': withWorkspace((project) => {
    project['architect'].build.options.styles = ['src/styles.scss'];
  }),
  'src/styles.scss': DEFINE_THEME,
};

describe('ngAdd', () => {
  const isTTY = process.stdout.isTTY;

  beforeEach(() => {
    process.stdout.isTTY = false;
  });

  afterEach(() => {
    process.stdout.isTTY = isTTY;
  });

  describe.each(['minimal', 'recommended', 'full'] as const)('the %s preset', (preset) => {
    it('prints the described plan, then the summary', async () => {
      const run = await runRule(ngAdd({ preset }), createFixtureTree());

      expect(run.logs).toMatchSnapshot();
    });
  });

  describe.each(['minimal', 'recommended', 'full'] as const)('the existing tailwind app with the %s preset', (preset) => {
    const fixture = readFixture('existing-tailwind-app');

    it('prints the described plan, then the summary', async () => {
      const run = await runRule(ngAdd({ preset, yes: true }), createFixtureTree('existing-tailwind-app'));

      expect(run.logs).toMatchSnapshot();
    });

    it('edits the files it plans in place and leaves every other file as it was', async () => {
      const run = await runRule(ngAdd({ preset, yes: true }), createFixtureTree('existing-tailwind-app'));
      const changed = Object.keys(fixture).filter((path) => run.tree.readContent(path) !== fixture[path]);

      expect(Object.keys(fixture).filter((path) => !run.tree.exists(path))).toEqual([]);
      expect(changed).toEqual(
        preset === 'minimal'
          ? ['package.json']
          : ['angular.json', 'package.json', 'src/app/app.config.ts', 'src/styles.scss'],
      );
      const styles = run.tree.readContent('src/styles.scss');
      expect(
        styles.replace("@import './cngx-layers.css';\n", '').replace("@import '@cngx/themes/cngx.css';\n", ''),
      ).toBe(fixture['src/styles.scss']);
      expect(run.tree.readContent('package.json').endsWith('}\n')).toBe(true);
      if (preset !== 'minimal') {
        expect(styles.startsWith("@import './cngx-layers.css';\n@import 'tailwindcss';\n@import '@cngx/themes/cngx.css';\n")).toBe(
          true,
        );
        expect(run.tree.readContent('src/cngx-layers.css')).toContain('@layer theme, base, cngx, components, utilities;');
        expect(run.tree.readContent('src/app/app.config.ts')).toContain(
          '    { provide: TitleStrategy, useClass: AppTitleStrategy },\n    provideA11yPreferences(withPersistence()),\n',
        );
        expect(run.tree.readContent('src/app/app.config.ts')).toMatch(/import \{ provideA11yPreferences, withPersistence[ ,}]/);
      }
    });

    it('changes nothing on a second run', async () => {
      const first = await runRule(ngAdd({ preset, yes: true }), createFixtureTree('existing-tailwind-app'));
      const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);

      const second = await runRule(ngAdd({ preset, yes: true }), first.tree);

      expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
      expect(second.tree.readContent('.cngx/install.json')).toBe(first.tree.readContent('.cngx/install.json'));
      expect(second.tasks).toEqual([]);
      expect(second.logs).toContain('cngx is already set up; nothing changed.');
    });
  });

  describe('a tailwind app cngx cannot order', () => {
    it('notes Tailwind v3 and writes no layer order file', async () => {
      const manifest = JSON.parse(readFixture('existing-tailwind-app')['package.json']) as {
        dependencies: Record<string, string>;
      };
      const run = await runRule(
        ngAdd({ yes: true }),
        createFixtureTree('existing-tailwind-app', {
          'package.json': `${JSON.stringify({ ...manifest, dependencies: { ...manifest.dependencies, tailwindcss: '^3.4.17' } }, null, 2)}\n`,
          'src/styles.scss': '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
        }),
      );

      expect(run.tree.exists('src/cngx-layers.css')).toBe(false);
      expect(run.logs.some((line) => line.includes('Tailwind v3 preflight overrides cngx component styles'))).toBe(true);
    });

    it('notes a layer order file someone else wrote and leaves it alone', async () => {
      const run = await runRule(
        ngAdd({ yes: true }),
        createFixtureTree('existing-tailwind-app', { 'src/cngx-layers.css': '@layer reset, app;\n' }),
      );

      expect(run.tree.readContent('src/cngx-layers.css')).toBe('@layer reset, app;\n');
      expect(run.tree.readContent('src/styles.scss')).not.toContain('cngx-layers.css');
      expect(run.logs.some((line) => line.includes('src/cngx-layers.css exists and was not written by cngx'))).toBe(true);
    });
  });

  describe('a standalone css app', () => {
    it('pins the lockstep graph, imports cngx.css, adds the theme and the a11y providers', async () => {
      const run = await runRule(ngAdd({}), createFixtureTree());
      const manifest = json<{ dependencies: Record<string, string> }>(run.tree, 'package.json');

      expect(manifest.dependencies['@cngx/ui']).toBe(VERSION);
      expect(manifest.dependencies['@cngx/themes']).toBe(VERSION);
      expect(manifest.dependencies['@angular/cdk']).toBe('^21.2.0');
      expect(run.tree.readContent('src/styles.css').startsWith("@import '@cngx/themes/cngx.css';\n")).toBe(true);
      expect(run.tree.readContent('src/cngx-theme.css')).toContain('@layer cngx.theme {');
      expect(styles(run.tree)).toEqual(['src/styles.css', 'src/cngx-theme.css']);
      expect(run.tree.readContent('src/app/app.config.ts')).toContain('provideA11yPreferences(withPersistence())');
      expect(json<{ preset: string }>(run.tree, '.cngx/install.json').preset).toBe('recommended');
      expect(run.tasks).toEqual(['node-package']);
    });

    it('notes the missing eslint config instead of guessing one', async () => {
      const run = await runRule(ngAdd({}), createFixtureTree());

      expect(run.logs).toContain(
        '  Skip the eslint entry - no eslint flat config (eslint.config.js, .mjs, .cjs, .ts, .mts or .cts) found; set one up with `ng add angular-eslint`, then run `ng add @cngx/core` again',
      );
      expect(run.tree.exists('eslint.config.js')).toBe(false);
    });
  });

  it('extends an eslint flat config and pins the plugin as a devDependency', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree('standalone-app', ESLINT_APP));
    const devDependencies = json<{ devDependencies: Record<string, string> }>(run.tree, 'package.json').devDependencies;

    expect(run.tree.readContent('eslint.config.js')).toContain("const cngx = require('@cngx/eslint-plugin');");
    expect(run.tree.readContent('eslint.config.js')).toContain('  ...cngx.configs.recommended,\n]);');
    expect(devDependencies['@cngx/eslint-plugin']).toBe(DEFAULT_ESLINT_PLUGIN_VERSION);
    expect(devDependencies['@angular-eslint/template-parser']).toBe('21.3.0');
  });

  it('leaves a legacy eslintrc app alone and names the migration command', async () => {
    const run = await runRule(
      ngAdd({}),
      createFixtureTree('standalone-app', {
        '.eslintrc.json': '{ "root": true }\n',
        'package.json': withDevDependencies({ eslint: '^9.39.0', 'typescript-eslint': '8.56.1' }),
      }),
    );

    expect(run.logs.filter((line) => line.startsWith('  Skip the eslint entry'))).toEqual([
      '  Skip the eslint entry - .eslintrc.json is a legacy config; migrate with `npx @eslint/migrate-config .eslintrc.json`, then run `ng add @cngx/core` again',
    ]);
    expect(run.tree.readContent('.eslintrc.json')).toBe('{ "root": true }\n');
    expect(run.tree.files.filter((path) => path.includes('eslint.config'))).toEqual([]);
    expect(json<{ devDependencies: Record<string, string> }>(run.tree, 'package.json').devDependencies['@cngx/eslint-plugin']).toBeUndefined();
  });

  it('bridges the Material map API of a css app after its global stylesheet', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree('standalone-app', MATERIAL_CSS_APP));

    expect(run.tree.readContent('src/cngx-theme.scss')).toContain('@include cngx-material.theme-system(-2);');
    expect(styles(run.tree)).toEqual(['src/material-theme.scss', 'src/styles.css', 'src/cngx-theme.scss']);
    expect(run.tree.readContent('src/styles.css')).toContain("@import '@cngx/themes/cngx.css';");
    expect(json<{ dependencies: Record<string, string> }>(run.tree, 'package.json').dependencies['@angular/material']).toBe(
      '^21.2.0',
    );
  });

  it('bridges a define-theme object in the stylesheet that defines it', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree('standalone-app', DEFINE_THEME_SCSS_APP));
    const stylesheet = run.tree.readContent('src/styles.scss');

    expect(stylesheet).toContain(
      "@use '@angular/material' as mat;\n@import '@cngx/themes/cngx.css';\n@use '@cngx/themes/material/theme' as cngx-material;\n",
    );
    expect(stylesheet).toContain('html {\n  @include cngx-material.theme($theme); /* cngx:theme:bridge */\n}\n');
    expect(run.tree.exists('src/cngx-theme.scss')).toBe(false);
  });

  it('provides into the root NgModule of an NgModule app', async () => {
    const run = await runRule(
      ngAdd({}),
      createFixtureTree('standalone-app', { 'src/main.ts': NGMODULE_MAIN, 'src/app/app-module.ts': APP_MODULE }),
    );

    expect(run.tree.readContent('src/app/app-module.ts')).toContain('    provideA11yPreferences(withPersistence()),\n');
  });

  it('provides the rtl direction for an RTL source locale', async () => {
    const tree = createFixtureTree('standalone-app', {
      'angular.json': withWorkspace((project) => {
        project['i18n'] = { sourceLocale: 'ar' };
      }),
    });
    const run = await runRule(ngAdd({}), tree);

    expect(run.tree.readContent('src/app/app.config.ts')).toContain("provideDirection('rtl')");
  });

  describe('an existing app', () => {
    const existing = () => createFixtureTree('standalone-app', { 'src/app/other.ts': SECOND_COMPONENT });

    it('applies without a terminal to confirm in and says so', async () => {
      const run = await runRule(ngAdd({}), existing());

      expect(run.logs).toContain('No terminal to confirm in; applying the plan. Pass --yes to apply without this line.');
      expect(run.tree.exists('src/cngx-theme.css')).toBe(true);
    });

    it('lists the preflight checklist before the plan', async () => {
      const run = await runRule(ngAdd({ yes: true }), existing());
      const preflight = run.logs.indexOf('Preflight:');

      expect(run.logs.slice(preflight + 1, preflight + 4)).toEqual([
        expect.stringMatching(/^ {2}ok Angular \S+ \(cngx needs \d+\.\d+ or newer\)$/),
        '  ok Project fixture-app (existing app)',
        '  ok Git working tree clean (review the cngx changes with git diff afterwards)',
      ]);
      expect(preflight).toBeLessThan(run.logs.findIndex((line) => line.startsWith('Planned')));
    });

    it('warns about uncommitted changes in the preflight checklist', async () => {
      terminal.git = 'dirty';
      try {
        const run = await runRule(ngAdd({ yes: true }), existing());

        expect(run.logs).toContain(
          '  ! Git working tree has uncommitted changes (the cngx changes will mix with them in git diff)',
        );
      } finally {
        terminal.git = 'clean';
      }
    });

    it('skips the confirmation with --yes', async () => {
      const run = await runRule(ngAdd({ yes: true }), existing());

      expect(run.logs.some((line) => line.startsWith('No terminal to confirm in'))).toBe(false);
    });

    it('wires the AI tooling into an app that has editor files but none from ng new --ai-config', async () => {
      const tree = createFixtureTree('standalone-app', {
        'src/app/other.ts': SECOND_COMPONENT,
        'CLAUDE.md': '# Team rules\n\nUse pnpm.\n',
        '.vscode/settings.json': '{}',
        '.mcp.json': JSON.stringify({ mcpServers: { tooling: { command: 'node', args: ['tools/mcp.js'] } } }, null, 2),
      });
      const first = await runRule(ngAdd({ preset: 'full', yes: true }), tree);

      expect(first.tree.readText('CLAUDE.md')).toMatch(/^# Team rules\n\nUse pnpm\.\n\n<!-- cngx:agents -->\n/);
      expect(first.tree.readText('AGENTS.md')).toMatch(/^<!-- cngx:agents -->\n/);
      expect(Object.keys(json<{ mcpServers: object }>(first.tree, '.mcp.json').mcpServers)).toEqual(['tooling', 'cngx']);
      expect(json<{ servers: object }>(first.tree, '.vscode/mcp.json').servers).toHaveProperty('cngx');
      expect(first.tree.readText('.cngx/README.md')).toContain('A marked cngx block in `CLAUDE.md` and `AGENTS.md`');

      const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);
      const second = await runRule(ngAdd({ preset: 'full', yes: true }), first.tree);
      expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
    });

    it('remembers a removed cngx server and agent block until --ai-tools asks for them again', async () => {
      const tree = createFixtureTree('standalone-app', { 'src/app/other.ts': SECOND_COMPONENT, 'CLAUDE.md': '' });
      const first = await runRule(ngAdd({ preset: 'full', yes: true }), tree);
      first.tree.overwrite('.mcp.json', '{ "mcpServers": {} }\n');
      first.tree.overwrite('CLAUDE.md', '');

      const second = await runRule(ngAdd({ preset: 'full', yes: true }), first.tree);

      expect(second.tree.readText('.mcp.json')).toBe('{ "mcpServers": {} }\n');
      expect(second.tree.readText('CLAUDE.md')).toBe('');
      expect(second.logs.join('\n')).toContain('removed since the last install; pass --ai-tools claude to add it back');

      const third = await runRule(ngAdd({ preset: 'full', aiTools: ['claude'], yes: true }), second.tree);

      expect(json<{ mcpServers: object }>(third.tree, '.mcp.json').mcpServers).toHaveProperty('cngx');
      expect(third.tree.readText('CLAUDE.md')).toContain('<!-- cngx:agents -->');
    });

    it('brings a removed cngx server back when the user picks its editor in the question', async () => {
      const tree = createFixtureTree('standalone-app', {
        'src/app/other.ts': SECOND_COMPONENT,
        'CLAUDE.md': '',
      });
      const first = await runRule(ngAdd({ preset: 'full', yes: true }), tree);
      first.tree.overwrite('.mcp.json', '{ "mcpServers": {} }\n');
      vi.stubEnv('CI', '');
      process.stdout.isTTY = true;
      terminal.editorPicks = ['claude'];
      try {
        const second = await runRule(ngAdd({ yes: true, quiet: true }), first.tree);

        expect(json<{ mcpServers: object }>(second.tree, '.mcp.json').mcpServers).toHaveProperty(
          'cngx',
        );
      } finally {
        terminal.editorPicks = [];
        vi.unstubAllEnvs();
      }
    });

    it('appends to the files ng new --ai-config wrote and creates no CLAUDE.md of its own', async () => {
      const tree = createFixtureTree('standalone-app', {
        'src/app/other.ts': SECOND_COMPONENT,
        'AGENTS.md': ANGULAR_AI_RULES,
        '.claude/CLAUDE.md': ANGULAR_AI_RULES,
        '.cursor/rules/cursor.mdc': `---\ncontext: true\n---\n${ANGULAR_AI_RULES}`,
      });
      const run = await runRule(ngAdd({ preset: 'full', yes: true }), tree);

      expect(run.tree.readText('.claude/CLAUDE.md')).toMatch(new RegExp(`^${escapeRegExp(ANGULAR_AI_RULES)}\n<!-- cngx:agents -->\n`));
      expect(run.tree.readText('AGENTS.md')).toMatch(new RegExp(`^${escapeRegExp(ANGULAR_AI_RULES)}\n<!-- cngx:agents -->\n`));
      expect(run.tree.readText('.cursor/rules/cursor.mdc')).toBe(`---\ncontext: true\n---\n${ANGULAR_AI_RULES}`);
      expect(run.tree.exists('CLAUDE.md')).toBe(false);
    });
  });

  it('plans nothing for a current readme the app formatter rewrote', async () => {
    const first = await runRule(ngAdd({ preset: 'full' }), createFixtureTree('standalone-app', { 'CLAUDE.md': '' }));
    const formatted = first.tree.readText('.cngx/README.md').replace('|-|-|-|', '| ---- | --------------- | ---------- |');
    first.tree.overwrite('.cngx/README.md', formatted);

    const second = await runRule(ngAdd({ preset: 'full' }), first.tree);

    expect(second.tree.readText('.cngx/README.md')).toBe(formatted);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
  });

  it('keeps a configured editor in the readme when a later run chooses another', async () => {
    const first = await runRule(ngAdd({ aiTools: ['claude'] }), createFixtureTree('standalone-app', { '.vscode/settings.json': '{}' }));
    const second = await runRule(ngAdd({ preset: 'full' }), first.tree);
    const readme = second.tree.readText('.cngx/README.md');

    expect(readme).toContain('- `.mcp.json`\n- `.vscode/mcp.json`\n');
    expect(readme).toContain('claude mcp list');
  });

  it('leaves a config whose servers key is not an object untouched and says so', async () => {
    const run = await runRule(
      ngAdd({ preset: 'full' }),
      createFixtureTree('standalone-app', { '.vscode/mcp.json': '{ "servers": [] }\n' }),
    );

    expect(run.tree.readText('.vscode/mcp.json')).toBe('{ "servers": [] }\n');
    expect(run.logs).toContain('  Skip .vscode/mcp.json - it has no servers object cngx can add to; add servers.cngx by hand');
  });

  it('registers the mcp server for the editors a full run detects, next to the servers already there', async () => {
    const run = await runRule(
      ngAdd({ preset: 'full' }),
      createFixtureTree('standalone-app', {
        'CLAUDE.md': '# app\n',
        '.mcp.json': JSON.stringify({ mcpServers: { other: { command: 'other' } } }, null, 2),
        'AGENTS.md': '# Agents\n',
      }),
    );

    expect(json<Record<string, unknown>>(run.tree, '.mcp.json')).toEqual({
      mcpServers: { other: { command: 'other' }, cngx: { command: 'npx', args: ['-y', expect.stringMatching(/^@cngx\/mcp@/)] } },
    });
    expect(run.tree.exists('.cursor/mcp.json')).toBe(false);
    expect(run.tree.readText('CLAUDE.md')).toMatch(/^# app\n\n<!-- cngx:agents -->\n/);
    expect(run.tree.readText('AGENTS.md')).toBe('# Agents\n');
    expect(run.tree.readText('.cngx/README.md')).toContain('## Claude Code plugin');
  });

  it('refuses an Angular version below 21.2', async () => {
    const tree = createFixtureTree('standalone-app', { 'package.json': withDependencies({ '@angular/core': '^20.3.0' }) });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow('cngx needs Angular 21.2 or newer; this app declares ^20.3.0.');
  });

  it.each([
    ['a standalone css app', {}],
    ['a Material css app', MATERIAL_CSS_APP],
    ['a define-theme scss app', DEFINE_THEME_SCSS_APP],
    ['an app with an eslint config', ESLINT_APP],
    ['an app with editor configs', { 'CLAUDE.md': '', '.vscode/mcp.json': '{ "servers": {} }', 'AGENTS.md': '# Agents\n' }],
  ])('changes nothing on a second run over %s', async (_name, overrides) => {
    const first = await runRule(ngAdd({ preset: 'full' }), createFixtureTree('standalone-app', overrides));
    const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);

    const second = await runRule(ngAdd({ preset: 'full' }), first.tree);

    expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
    expect(second.tasks).toEqual([]);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
    expect(second.logs.some((line) => line.startsWith('Planned'))).toBe(false);
    expect(second.logs.some((line) => line.startsWith('No terminal to confirm in'))).toBe(false);
  });

  it('brings a removed language provider back over the generated language file', async () => {
    const first = await runRule(ngAdd({ i18n: 'de', runtimeSwitch: true, yes: true }), createFixtureTree());
    const config = first.tree.readContent('src/app/app.config.ts');
    const language = first.tree.readContent('src/app/cngx-language.ts');
    first.tree.overwrite('src/app/app.config.ts', config.replace(/\s*provideCngxI18n\(withPack\(cngxLanguagePack\)\),?/, ''));
    expect(first.tree.readContent('src/app/app.config.ts')).not.toContain('provideCngxI18n(');

    const second = await runRule(ngAdd({ i18n: 'de', runtimeSwitch: true, yes: true }), first.tree);

    expect(second.tree.readContent('src/app/app.config.ts')).toContain('provideCngxI18n(withPack(cngxLanguagePack))');
    expect(second.tree.readContent('src/app/cngx-language.ts')).toBe(language);
  });

  it('creates the language file and names the provider edit when the German pack is already provided', async () => {
    const first = await runRule(ngAdd({ i18n: 'de', yes: true }), createFixtureTree());
    const config = first.tree.readContent('src/app/app.config.ts');

    const second = await runRule(ngAdd({ i18n: 'de', runtimeSwitch: true, yes: true }), first.tree);

    expect(second.tree.exists('src/app/cngx-language.ts')).toBe(true);
    expect(second.tree.readContent('src/app/app.config.ts')).toBe(config);
    expect(config.match(/provideCngxI18n\(/g)).toHaveLength(1);
    expect(second.logs.join('\n')).toContain('Switch the language at runtime');
    expect(second.logs.join('\n')).toContain('`withPack(CNGX_LANGUAGE_DE)`');
  });

  it('writes no @cngx/core import into a utils-only app', async () => {
    const run = await runRule(ngAdd({ libs: ['utils'] }), createFixtureTree());

    expect(run.tree.readContent('src/app/app.config.ts')).not.toContain('@cngx');
    expect(Object.keys(json<{ dependencies: Record<string, string> }>(run.tree, 'package.json').dependencies)).not.toContain(
      '@cngx/core',
    );
  });

  it('installs only the packages for minimal', async () => {
    const run = await runRule(ngAdd({ preset: 'minimal' }), createFixtureTree());

    expect(run.tree.exists('src/cngx-theme.css')).toBe(false);
    expect(run.tree.readContent('src/app/app.config.ts')).not.toContain('@cngx');
    expect(run.tasks).toEqual(['node-package']);
  });

  it('prints only the summary when quiet', async () => {
    const run = await runRule(ngAdd({ quiet: true }), createFixtureTree());

    expect(run.logs[0]).toMatch(/^cngx planned \d+ changes\.$/);
    expect(run.logs.some((line) => line.startsWith('Planned'))).toBe(false);
  });

  it('asks nothing without a terminal, even with prompts on', async () => {
    const run = await runRule(ngAdd({ prompts: true }), createFixtureTree());

    expect(run.tasks).toEqual(['node-package']);
    expect(run.logs.some((line) => line.includes('?'))).toBe(false);
  });
});

describe('the ng-add collection', () => {
  it('is a single stage with no setup schematic', () => {
    expect(Object.keys(COLLECTION.schematics)).toEqual(['ng-add']);
  });

  it('offers exactly the answer vocabulary the steps understand', () => {
    const enums = SCHEMA.properties as Record<string, { enum?: readonly string[]; items?: { enum?: readonly string[] } }>;

    expect(enums['preset'].enum).toEqual(NG_ADD_PRESETS);
    expect(enums['libs'].items?.enum).toEqual(CNGX_LIBS);
    expect(enums['theme'].enum).toEqual(THEME_CHOICES);
    expect(enums['i18n'].enum).toEqual(LANGUAGES);
    expect(enums['aiTools'].items?.enum).toEqual(AI_TOOLS);
  });

  it('describes the editor configs the aiTools step writes', () => {
    const description = (SCHEMA.properties['aiTools'] as { description: string }).description;

    expect(description).toContain('project MCP config');
    expect(description).toContain('.cngx/README.md');
    expect(description).not.toContain('writes no editor config');
  });

  it('declares no option the ng add command strips', () => {
    const stripped = [
      'interactive',
      'dryRun',
      'force',
      'defaults',
      'registry',
      'verbose',
      'skipConfirmation',
    ];

    expect(Object.keys(SCHEMA.properties).filter((name) => stripped.includes(name))).toEqual([]);
    expect(Object.keys(SCHEMA.properties)).toEqual([
      'project',
      'preset',
      'libs',
      'theme',
      'i18n',
      'runtimeSwitch',
      'lint',
      'a11yPreferences',
      'feedback',
      'floatingFallback',
      'aiTools',
      'yes',
      'prompts',
      'quiet',
    ]);
  });
});
