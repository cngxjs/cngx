import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { format } from 'prettier';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import {
  AI_TOOLS,
  CNGX_LIBS,
  DEFAULT_ESLINT_PLUGIN_VERSION,
  LANGUAGES,
  NG_ADD_PRESETS,
  THEME_CHOICES,
} from '../engine';
import { createFixtureTree, readFixture, readTree, runRule } from '../testing/run-schematic';
import { ngAdd } from './index';
import { PRESET_CHOICES } from './shell/questions';

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
const terminal = vi.hoisted(() => ({
  editorPicks: [] as string[],
  git: 'clean',
  confirms: [] as string[],
  asked: [] as string[],
}));

vi.mock('./shell/git-state', () => ({ readGitState: () => terminal.git }));

// Specs run unstamped, as a local build does; a case that checks the real
// pins sets `stamped` to the versions a release writes into versions.json.
const release = vi.hoisted(() => ({ stamped: undefined as { cngx: string; mcp: string; eslintPlugin: string; angular: string } | undefined }));

vi.mock('../engine/versions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../engine/versions')>();
  return {
    ...actual,
    resolveVersions: (...args: Parameters<typeof actual.resolveVersions>) =>
      release.stamped === undefined ? actual.resolveVersions(...args) : { versions: release.stamped },
  };
});

vi.mock('@inquirer/checkbox', () => ({
  default: (question: { message: string; choices: { value: string; checked?: boolean }[] }) => {
    terminal.asked.push(question.message);
    return Promise.resolve(
      question.message.includes('MCP server')
        ? terminal.editorPicks
        : question.choices
            .filter((choice) => choice.checked === true)
            .map((choice) => choice.value),
    );
  },
}));
vi.mock('@inquirer/select', () => ({
  default: (question: { message: string; default: string }) => {
    terminal.asked.push(question.message);
    return Promise.resolve(question.default);
  },
}));
vi.mock('@inquirer/confirm', () => ({
  default: (question: { message: string; default: boolean }) => {
    terminal.confirms.push(question.message);
    return Promise.resolve(question.default);
  },
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

// \`ng new\` output with the config written into the bootstrap call.
const INLINE_MAIN = `import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideBrowserGlobalErrorListeners()] })
  .catch((err) => console.error(err));
`;

function inlineBootstrapApp(): Tree {
  const tree = createFixtureTree('standalone-app', { 'src/main.ts': INLINE_MAIN });
  tree.delete('src/app/app.config.ts');
  return tree;
}

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

interface RecordedInstall {
  readonly preset: string;
  readonly cngxVersion: string;
  readonly answers: Record<string, unknown>;
  readonly steps: readonly { readonly id: string }[];
}

// The install record `ng add` keeps for one project of the workspace.
function record(tree: Tree, project = 'fixture-app'): RecordedInstall {
  const manifest = json<{ projects: Record<string, RecordedInstall> }>(tree, '.cngx/install.json');
  const found = manifest.projects[project];
  if (found === undefined) {
    throw new Error(`no install record for ${project}`);
  }
  return found;
}

// Two applications in one workspace: \`alpha\` standalone on CSS at the root,
// \`beta\` an NgModule app on SCSS under projects/.
interface FixtureProject {
  root: string;
  sourceRoot: string;
  architect: { build: { options: Record<string, unknown> } };
}

function twoApplications(): Tree {
  const workspace = JSON.parse(readFixture('standalone-app')['angular.json']) as {
    projects: Record<string, FixtureProject>;
  };
  const app = workspace.projects['fixture-app'];
  const beta = JSON.parse(JSON.stringify(app)) as FixtureProject;
  beta.root = 'projects/beta';
  beta.sourceRoot = 'projects/beta/src';
  beta.architect.build.options = {
    ...beta.architect.build.options,
    browser: 'projects/beta/src/main.ts',
    styles: ['projects/beta/src/styles.scss'],
  };
  workspace.projects = { alpha: app, beta };
  return createFixtureTree('standalone-app', {
    'angular.json': JSON.stringify(workspace, null, 2),
    'projects/beta/src/main.ts': NGMODULE_MAIN,
    'projects/beta/src/app/app-module.ts': APP_MODULE,
    'projects/beta/src/app/app.ts': readFixture('standalone-app')['src/app/app.ts'],
    'projects/beta/src/styles.scss': '',
  });
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
  const stdinIsTTY = process.stdin.isTTY;

  // Prompts need both ends; the cases flip stdout and keep an interactive stdin.
  beforeEach(() => {
    process.stdout.isTTY = false;
    process.stdin.isTTY = true;
  });

  afterEach(() => {
    process.stdout.isTTY = isTTY;
    process.stdin.isTTY = stdinIsTTY;
  });

  it('asks the preset first on a terminal, after the preflight checklist', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('NO_COLOR', '1');
    process.stdout.isTTY = true;
    terminal.asked = [];
    try {
      const run = await runRule(ngAdd({ yes: true }), createFixtureTree());

      expect(terminal.asked[0]).toBe('Which cngx setup do you want?');
      expect(run.logs[0]).toBe('Preflight:');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('asks no preset when the preflight refuses the run', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('NO_COLOR', '1');
    process.stdout.isTTY = true;
    terminal.asked = [];
    try {
      const tree = createFixtureTree('standalone-app', { 'package.json': withDependencies({ '@angular/core': '^20.3.0' }) });

      await expect(runRule(ngAdd({}), tree)).rejects.toThrow('cngx needs Angular 21.2 or newer');
      expect(terminal.asked).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('asks no preset when --preset answers it', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('NO_COLOR', '1');
    process.stdout.isTTY = true;
    terminal.asked = [];
    try {
      await runRule(ngAdd({ preset: 'minimal', yes: true }), createFixtureTree());

      expect(terminal.asked).not.toContain('Which cngx setup do you want?');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('asks nothing on a terminal whose stdin is not interactive', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('NO_COLOR', '1');
    process.stdout.isTTY = true;
    process.stdin.isTTY = false;
    terminal.confirms = [];
    terminal.asked = [];
    try {
      const run = await runRule(ngAdd({}), createFixtureTree('standalone-app', { 'src/app/other.ts': SECOND_COMPONENT }));

      expect([...terminal.asked, ...terminal.confirms]).toEqual([]);
      expect(run.logs).toContain('No terminal to confirm in; applying the plan. Pass --yes to apply without this line.');
    } finally {
      vi.unstubAllEnvs();
    }
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
          : [
              'angular.json',
              'package.json',
              'src/app/app.config.ts',
              ...(preset === 'full' ? ['src/app/app.html', 'src/app/app.ts'] : []),
              'src/styles.scss',
            ],
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
      release.stamped = { cngx: '0.1.0', mcp: '0.2.0', eslintPlugin: '0.2.0', angular: '^21.2.0' };
      onTestFinished(() => {
        release.stamped = undefined;
      });
      const run = await runRule(ngAdd({}), createFixtureTree());
      const manifest = json<{ dependencies: Record<string, string> }>(run.tree, 'package.json');

      expect(manifest.dependencies['@cngx/ui']).toBe('0.1.0');
      expect(manifest.dependencies['@cngx/themes']).toBe('0.1.0');
      expect(manifest.dependencies['@angular/cdk']).toBe('^21.2.0');
      expect(run.tree.readContent('src/styles.css').startsWith("@import '@cngx/themes/cngx.css';\n")).toBe(true);
      expect(run.tree.readContent('src/cngx-theme.css')).toContain('@layer cngx.theme {');
      expect(styles(run.tree)).toEqual(['src/styles.css', 'src/cngx-theme.css']);
      expect(run.tree.readContent('src/app/app.config.ts')).toContain('provideA11yPreferences(withPersistence())');
      expect(record(run.tree).preset).toBe('recommended');
      expect(run.tasks).toEqual(['node-package']);
    });

    it('keeps the declared @cngx versions of an unstamped local build and names pack-libs', async () => {
      const run = await runRule(ngAdd({}), createFixtureTree());
      const manifest = json<{ dependencies: Record<string, string> }>(run.tree, 'package.json');

      expect(Object.keys(manifest.dependencies).filter((name) => name.startsWith('@cngx/'))).toEqual([]);
      expect(run.logs.some((line) => line.includes('Keep the declared @cngx versions') && line.includes('node scripts/pack-libs.mjs'))).toBe(true);
      expect(VERSION).toBe('0.0.0-PLACEHOLDER');
    });

    it('notes the missing eslint config instead of guessing one', async () => {
      const run = await runRule(ngAdd({}), createFixtureTree());

      expect(run.logs).toContain(
        '  - Skip the eslint entry - no eslint flat config (eslint.config.js, .mjs, .cjs, .ts, .mts or .cts) found; set one up with `ng add angular-eslint`, then run `ng add @cngx/core` again',
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

    expect(run.logs.filter((line) => line.startsWith('  - Skip the eslint entry'))).toEqual([
      '  - Skip the eslint entry - .eslintrc.json is a legacy config; migrate with `npx @eslint/migrate-config .eslintrc.json`, then run `ng add @cngx/core` again',
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
      "@use '@angular/material' as mat;\n@use '@cngx/themes/material/theme' as cngx-material;\n@import '@cngx/themes/cngx.css';\n",
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

  describe('an inline bootstrap config', () => {
    it('provides into main.ts once over two runs and lists it in the quiet report', async () => {
      const first = await runRule(ngAdd({ yes: true, quiet: true }), inlineBootstrapApp());
      const main = first.tree.readContent('src/main.ts');

      expect(main.match(/provideA11yPreferences\(/g)).toHaveLength(1);
      expect(first.logs).toContain('  src/main.ts');

      const second = await runRule(ngAdd({ yes: true }), first.tree);

      expect(second.tree.readContent('src/main.ts')).toBe(main);
      expect(second.logs).toContain('cngx is already set up; nothing changed.');
    });

    it('asks before applying on a terminal', async () => {
      vi.stubEnv('CI', '');
      vi.stubEnv('NO_COLOR', '1');
      process.stdout.isTTY = true;
      terminal.confirms = [];
      try {
        await runRule(ngAdd({}), inlineBootstrapApp());

        expect(terminal.confirms).toContain('Apply these changes?');
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('creates the language file next to main.ts and imports it there', async () => {
      const run = await runRule(ngAdd({ i18n: 'de', runtimeSwitch: true, yes: true }), inlineBootstrapApp());

      expect(run.tree.exists('src/cngx-language.ts')).toBe(true);
      expect(run.tree.exists('src/app/cngx-language.ts')).toBe(false);
      expect(run.tree.readContent('src/main.ts')).toMatch(/import \{ cngxLanguagePack \} from '\.\/cngx-language';/);
      expect(run.tree.readContent('src/main.ts')).toContain('provideCngxI18n(withPack(cngxLanguagePack))');
    });
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
      vi.stubEnv('CI', '');
      try {
        const run = await runRule(ngAdd({}), existing());

        expect(run.logs).toContain(
          'No terminal to confirm in; applying the plan. Pass --yes to apply without this line.',
        );
        expect(run.tree.exists('src/cngx-theme.css')).toBe(true);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('names CI as the reason it applies without a confirm', async () => {
      vi.stubEnv('CI', 'true');
      process.stdout.isTTY = true;
      try {
        const run = await runRule(ngAdd({}), existing());

        expect(run.logs).toContain(
          'Running under CI; applying the plan without a confirm. Pass --yes to apply without this line.',
        );
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('names --no-prompts as the reason it applies without a confirm on a terminal', async () => {
      vi.stubEnv('CI', '');
      vi.stubEnv('NO_COLOR', '1');
      process.stdout.isTTY = true;
      try {
        const run = await runRule(ngAdd({ prompts: false }), existing());

        expect(run.logs).toContain(
          'Prompts are off (--no-prompts); applying the plan without a confirm. Pass --yes to apply without this line.',
        );
        expect(run.logs.some((line) => line.startsWith('No terminal to confirm in'))).toBe(false);
        expect(run.tree.exists('src/cngx-theme.css')).toBe(true);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('lists the preflight checklist before the plan', async () => {
      const run = await runRule(ngAdd({ yes: true }), existing());
      const preflight = run.logs.indexOf('Preflight:');

      expect(run.logs.slice(preflight + 1, preflight + 4)).toEqual([
        expect.stringMatching(/^ {2}ok Angular \S+ \(cngx needs \d+\.\d+\+\)$/),
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

    it('asks before applying on a terminal when the components live outside src/app', async () => {
      vi.stubEnv('CI', '');
      vi.stubEnv('NO_COLOR', '1');
      process.stdout.isTTY = true;
      terminal.confirms = [];
      try {
        await runRule(ngAdd({}), createFixtureTree('standalone-app', { 'src/features/other.ts': SECOND_COMPONENT }));

        expect(terminal.confirms).toContain('Apply these changes?');
      } finally {
        vi.unstubAllEnvs();
      }
    });

    describe.each([
      ['--interactive=false', '--interactive=false'],
      ['--no-interactive', '--no-interactive'],
      ['--defaults', '--defaults'],
      ['--defaults=true', '--defaults=true'],
    ])('with %s on a terminal', (flag, named) => {
      const argv = process.argv;

      afterEach(() => {
        process.argv = argv;
      });

      it('asks nothing and names the flag', async () => {
        vi.stubEnv('CI', '');
        vi.stubEnv('NO_COLOR', '1');
        process.stdout.isTTY = true;
        process.argv = [...argv.slice(0, 2), 'add', '@cngx/core', flag];
        terminal.confirms = [];
        terminal.asked = [];
        try {
          const run = await runRule(ngAdd({}), existing());

          expect([...terminal.asked, ...terminal.confirms]).toEqual([]);
          expect(run.logs).toContain(
            `Prompts are off (${named}); applying the plan without a confirm. Pass --yes to apply without this line.`,
          );
          expect(run.tree.exists('src/cngx-theme.css')).toBe(true);
        } finally {
          vi.unstubAllEnvs();
        }
      });
    });

    it('asks nothing on a terminal when a programmatic caller runs it non-interactive', async () => {
      vi.stubEnv('CI', '');
      vi.stubEnv('NO_COLOR', '1');
      process.stdout.isTTY = true;
      terminal.confirms = [];
      terminal.asked = [];
      try {
        const run = await runRule(ngAdd({}), existing(), {}, false);

        expect([...terminal.asked, ...terminal.confirms]).toEqual([]);
        expect(run.logs).toContain(
          'Prompts are off (interactive: false); applying the plan without a confirm. Pass --yes to apply without this line.',
        );
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('skips the confirmation with --yes', async () => {
      const run = await runRule(ngAdd({ yes: true }), existing());

      expect(run.logs.some((line) => line.startsWith('No terminal to confirm in'))).toBe(false);
    });

    // Before the install `ng add` hands `--yes=false` / `--prompts=false` /
    // `--quiet=true` over as strings; they must switch the same behaviour.
    describe('with the control switches as strings', () => {
      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('confirms on "false" and skips the confirmation on "true" for --yes', async () => {
        vi.stubEnv('CI', '');
        const confirming = await runRule(ngAdd({ yes: 'false' }), existing());
        const skipping = await runRule(ngAdd({ yes: 'true' }), existing());

        expect(confirming.logs).toContain(
          'No terminal to confirm in; applying the plan. Pass --yes to apply without this line.',
        );
        expect(skipping.logs.some((line) => line.startsWith('No terminal to confirm in'))).toBe(false);
      });

      it('turns the prompts off on a terminal for --prompts "false"', async () => {
        vi.stubEnv('CI', '');
        vi.stubEnv('NO_COLOR', '1');
        process.stdout.isTTY = true;
        const run = await runRule(ngAdd({ prompts: 'false' }), existing());

        expect(run.logs).toContain(
          'Prompts are off (--no-prompts); applying the plan without a confirm. Pass --yes to apply without this line.',
        );
      });

      it('prints only the summary for --quiet "true"', async () => {
        const run = await runRule(ngAdd({ quiet: 'true', yes: 'true' }), existing());

        expect(run.logs[0]).toMatch(/^cngx applied \d+ changes\.$/);
        expect(run.logs.some((line) => line.startsWith('Planned'))).toBe(false);
      });
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

  describe('the app shell outlets', () => {
    const PRETTIERRC = JSON.parse(readFixture('scaffold-21')['.prettierrc']) as Record<string, unknown>;

    it('places both outlets after the placeholder, imports them and provides feedback in the stock spec', async () => {
      const run = await runRule(ngAdd({ feedback: true, yes: true }), createFixtureTree('scaffold-21'));
      const template = run.tree.readText('src/app/app.html');

      expect(template.indexOf('<cngx-banner-outlet />')).toBeGreaterThan(template.indexOf('End of Placeholder'));
      expect(template.endsWith('<cngx-banner-outlet />\n<router-outlet />\n<cngx-toast-outlet />\n')).toBe(true);
      expect(run.tree.readText('src/app/app.ts')).toContain('imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],');
      expect(run.tree.readText('src/app/app.ts')).toContain("import { CngxBannerOutlet, CngxToastOutlet } from '@cngx/ui/feedback';");
      expect(run.tree.readText('src/app/app.spec.ts')).toContain('      providers: [provideFeedback(withToasts(), withBanners())],\n');
      expect(run.tree.readText('src/app/app.spec.ts')).toContain(
        "import { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback';",
      );
    });

    it('plans nothing on a second run, also after the app formatter rewrote every file', async () => {
      const first = await runRule(ngAdd({ feedback: true, yes: true }), createFixtureTree('scaffold-21'));
      const second = await runRule(ngAdd({ feedback: true, yes: true }), first.tree);

      expect(second.logs).toContain('cngx is already set up; nothing changed.');

      for (const path of ['src/app/app.html', 'src/app/app.ts', 'src/app/app.spec.ts']) {
        first.tree.overwrite(path, await format(first.tree.readText(path), { ...PRETTIERRC, filepath: path }));
      }
      const formatted = await runRule(ngAdd({ feedback: true, yes: true }), first.tree);

      expect(formatted.logs).toContain('cngx is already set up; nothing changed.');
    });

    it('places the outlets with the full preset and leaves the shell alone with minimal', async () => {
      const full = await runRule(ngAdd({ preset: 'full', yes: true }), createFixtureTree('scaffold-21-zone'));
      const minimal = await runRule(ngAdd({ preset: 'minimal', yes: true }), createFixtureTree('scaffold-21'));

      expect(full.tree.readText('src/app/app.html')).toContain('<cngx-toast-outlet />');
      expect(full.tree.readText('src/app/app.spec.ts')).toContain('provideFeedback(withToasts(), withBanners())');
      expect(minimal.tree.readText('src/app/app.html')).toBe(readFixture('scaffold-21')['src/app/app.html']);
      expect(minimal.tree.readText('src/app/app.spec.ts')).toBe(readFixture('scaffold-21')['src/app/app.spec.ts']);
    });

    it('leaves a single-quoted inline template as it is and names the snippet', async () => {
      const app = readFixture('scaffold-21')['src/app/app.ts'].replace("templateUrl: './app.html',", "template: '<router-outlet />',");
      const run = await runRule(ngAdd({ feedback: true, yes: true }), createFixtureTree('scaffold-21', { 'src/app/app.ts': app }));

      expect(run.tree.readText('src/app/app.ts')).toBe(app);
      expect(run.logs.join('\n')).toContain(
        'the inline template of App in src/app/app.ts is a quoted string, which cngx does not rewrite into a multi-line template',
      );
    });

    it('leaves an outlet removed after the install out until --feedback asks for it again', async () => {
      const first = await runRule(ngAdd({ preset: 'full', yes: true }), createFixtureTree('scaffold-21'));
      const removed = first.tree.readText('src/app/app.html').replace('<cngx-toast-outlet />\n', '');
      first.tree.overwrite('src/app/app.html', removed);

      const second = await runRule(ngAdd({ preset: 'full', yes: true }), first.tree);

      expect(second.tree.readText('src/app/app.html')).toBe(removed);
      expect(second.logs.join('\n')).toContain('the outlets were removed after cngx placed them; pass --feedback to place them again');

      const third = await runRule(ngAdd({ preset: 'full', feedback: true, yes: true }), second.tree);

      expect(third.tree.readText('src/app/app.html')).toContain('<cngx-toast-outlet />');
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

  it('keeps the recorded answers on a re-run without flags or a terminal', async () => {
    const first = await runRule(
      ngAdd({ i18n: 'de', aiTools: ['claude'], yes: true }),
      createFixtureTree('standalone-app', { 'CLAUDE.md': '' }),
    );
    const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);

    const second = await runRule(ngAdd({ yes: true }), first.tree);

    expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
  });

  it('keeps a recorded full preset on a re-run without --preset or a terminal', async () => {
    const first = await runRule(ngAdd({ preset: 'full', yes: true }), createFixtureTree('standalone-app', { 'CLAUDE.md': '' }));
    const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);

    const second = await runRule(ngAdd({ yes: true }), first.tree);

    expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
    expect(second.logs.join('\n')).not.toContain('Start from the');
  });

  it('names a re-run that starts from another preset than the recorded one', async () => {
    const first = await runRule(ngAdd({ yes: true }), createFixtureTree());

    const second = await runRule(ngAdd({ preset: 'full', yes: true }), first.tree);

    expect(second.logs).toContain(
      '  - Start from the full preset - the last install used recommended, so its answers are not reused; pass --preset=recommended to keep them',
    );
  });

  describe('a workspace with several applications', () => {
    it('warns in the preflight when no --project picks one', async () => {
      const run = await runRule(ngAdd({ yes: true }), twoApplications());

      expect(run.logs).toContain('  ! Project alpha (picked; pass --project to choose; fresh app; other applications: beta)');
    });

    it('does not warn when --project names one', async () => {
      const run = await runRule(ngAdd({ project: 'beta', yes: true }), twoApplications());

      expect(run.logs.some((line) => line.includes('picked; pass --project'))).toBe(false);
    });

    it('keeps one install record per project', async () => {
      const alpha = await runRule(ngAdd({ project: 'alpha', yes: true }), twoApplications());
      const beta = await runRule(ngAdd({ project: 'beta', yes: true }), alpha.tree);

      expect(record(beta.tree, 'alpha').preset).toBe('recommended');
      expect(record(beta.tree, 'beta').preset).toBe('recommended');
      expect(json<{ schemaVersion: number }>(beta.tree, '.cngx/install.json').schemaVersion).toBe(2);
      expect(beta.tree.readContent('projects/beta/src/app/app-module.ts')).toContain('provideA11yPreferences(');
    });

    it('places the outlets of a project whose own record holds none, though another project recorded them', async () => {
      const tree = twoApplications();
      tree.create('projects/beta/src/app/app.html', '<router-outlet />\n');
      const alpha = await runRule(ngAdd({ project: 'alpha', feedback: true, yes: true }), tree);
      // The preset default is not an explicit --feedback, so only beta's own record could withdraw them.
      const beta = await runRule(ngAdd({ project: 'beta', preset: 'full', yes: true }), alpha.tree);

      expect(record(alpha.tree, 'alpha').steps.map((step) => step.id)).toContain('app-shell:outlets');
      expect(beta.tree.readContent('projects/beta/src/app/app.html')).toBe(
        '<cngx-banner-outlet />\n<router-outlet />\n<cngx-toast-outlet />\n',
      );
      expect(beta.tree.readContent('projects/beta/src/app/app-module.ts')).toContain('CngxBannerOutlet');
    });

    it('plans nothing for a project re-run after another project was added', async () => {
      const alpha = await runRule(ngAdd({ project: 'alpha', yes: true }), twoApplications());
      const beta = await runRule(ngAdd({ project: 'beta', yes: true }), alpha.tree);
      const manifest = beta.tree.readContent('.cngx/install.json');

      const again = await runRule(ngAdd({ project: 'alpha', yes: true }), beta.tree);

      expect(again.tree.readContent('.cngx/install.json')).toBe(manifest);
      expect(again.logs).toContain('cngx is already set up; nothing changed.');
      expect(again.logs.some((line) => line.includes('preset'))).toBe(false);
    });
  });

  describe('an unreadable install manifest', () => {
    const unreadable = [
      ['schema version 1', JSON.stringify({ schemaVersion: 1, preset: 'minimal', answers: {}, steps: [] }), 'is not an install record this release reads'],
      ['a truncated file', '{ "schemaVersion": 2, "projects": {', 'is not valid JSON'],
      ['a malformed record', JSON.stringify({ schemaVersion: 2, projects: { 'fixture-app': { preset: 'minimal' } } }), 'is not an install record this release reads'],
    ] as const;

    it.each(unreadable)('keeps %s as a copy and starts a new record', async (_shape, content, says) => {
      const run = await runRule(ngAdd({ yes: true }), createFixtureTree('standalone-app', { '.cngx/install.json': content }));

      expect(run.tree.readContent('.cngx/install.json.unreadable')).toBe(content);
      expect(record(run.tree).preset).toBe('recommended');
      expect(run.logs).toContain(
        `  + Start a new install record - .cngx/install.json ${says}; it is kept as .cngx/install.json.unreadable and replaced by a record of fixture-app only`,
      );
    });

    it('keeps a file that is not utf-8 byte for byte', async () => {
      const bytes = Buffer.from([0x7b, 0xff, 0xfe, 0x7d]);
      const tree = createFixtureTree('standalone-app');
      tree.create('.cngx/install.json', bytes);

      const run = await runRule(ngAdd({ yes: true }), tree);

      expect(run.tree.read('.cngx/install.json.unreadable')).toEqual(bytes);
      expect(record(run.tree).preset).toBe('recommended');
    });

    it('lists the copy and the reset, the actions --dry-run prints, before it applies them', async () => {
      const run = await runRule(ngAdd({ yes: true }), createFixtureTree('standalone-app', { '.cngx/install.json': 'not json' }));
      const planned = run.logs.indexOf('  + Clear .cngx/install.json - its content is kept in .cngx/install.json.unreadable');

      expect(planned).toBeGreaterThan(
        run.logs.findIndex((line) => line.startsWith('  + Start a new install record')),
      );
      expect(run.tree.actions.map((action) => [action.kind, action.path])).toEqual(
        expect.arrayContaining([
          ['c', '/.cngx/install.json.unreadable'],
          ['o', '/.cngx/install.json'],
        ]),
      );
    });

    it('plans nothing on the run after the recovery', async () => {
      const first = await runRule(ngAdd({ yes: true }), createFixtureTree('standalone-app', { '.cngx/install.json': 'not json' }));

      const again = await runRule(ngAdd({ yes: true }), first.tree);

      expect(again.logs).toContain('cngx is already set up; nothing changed.');
      expect(again.tree.readContent('.cngx/install.json.unreadable')).toBe('not json');
      expect(again.tree.exists('.cngx/install.json.unreadable-2')).toBe(false);
    });

    it('starts over with only the project of the run in a two-project workspace', async () => {
      const tree = twoApplications();
      tree.create('.cngx/install.json', 'not json');

      const run = await runRule(ngAdd({ project: 'beta', yes: true }), tree);
      const { projects } = json<{ projects: Record<string, unknown> }>(run.tree, '.cngx/install.json');

      expect(Object.keys(projects)).toEqual(['beta']);
      expect(run.tree.readContent('.cngx/install.json.unreadable')).toBe('not json');
      expect(run.logs).toContain(
        '  + Start a new install record - .cngx/install.json is not valid JSON; it is kept as .cngx/install.json.unreadable and replaced by a record of beta only',
      );
    });

    it('never overwrites an earlier copy', async () => {
      const run = await runRule(
        ngAdd({ yes: true }),
        createFixtureTree('standalone-app', {
          '.cngx/install.json': 'not json',
          '.cngx/install.json.unreadable': 'first copy',
        }),
      );

      expect(run.tree.readContent('.cngx/install.json.unreadable')).toBe('first copy');
      expect(run.tree.readContent('.cngx/install.json.unreadable-2')).toBe('not json');
      expect(record(run.tree).preset).toBe('recommended');
    });
  });

  describe('the recorded libs', () => {
    const recordedLibs = (tree: Tree): unknown => record(tree).answers['libs'];
    const declared = (tree: Tree): Record<string, string> =>
      json<{ dependencies: Record<string, string> }>(tree, 'package.json').dependencies;
    const declare = (tree: Tree, name: string): void => {
      const manifest = json<{ dependencies: Record<string, string> }>(tree, 'package.json');
      tree.overwrite('package.json', JSON.stringify({ ...manifest, dependencies: { ...manifest.dependencies, [name]: VERSION } }, null, 2) + '\n');
    };

    it('keeps every recorded lib when a re-run asks for fewer and says so', async () => {
      const first = await runRule(ngAdd({ yes: true }), createFixtureTree());

      const second = await runRule(ngAdd({ libs: 'core', yes: true }), first.tree);

      expect(recordedLibs(second.tree)).toEqual([...CNGX_LIBS]);
      expect(second.logs).toContain(
        '  - Keep the recorded packages - @cngx/common, @cngx/interop, @cngx/forms, @cngx/data-display, @cngx/ui stay because the last install recorded them or package.json declares them; to remove one, delete it from package.json and from projects.fixture-app.answers.libs in .cngx/install.json',
      );
    });

    it('records a lib package.json declares that the last install did not', async () => {
      const first = await runRule(ngAdd({ libs: 'core', yes: true }), createFixtureTree());
      declare(first.tree, '@cngx/forms');

      const second = await runRule(ngAdd({ yes: true }), first.tree);

      expect(recordedLibs(second.tree)).toEqual(['core', 'forms']);
      expect(declared(second.tree)['@cngx/forms']).toBe(VERSION);
      expect(second.logs).toContain(
        '  - Keep the recorded packages - @cngx/forms stays because the last install recorded it or package.json declares it; to remove it, delete it from package.json and from projects.fixture-app.answers.libs in .cngx/install.json',
      );
    });

    it('records the package a shim pinned before it delegated', async () => {
      const tree = createFixtureTree();
      declare(tree, '@cngx/forms');

      const run = await runRule(ngAdd({ libs: 'core', yes: true }), tree);

      expect(recordedLibs(run.tree)).toEqual(['core', 'forms']);
      expect(run.logs.some((line) => line.startsWith('  - Keep the recorded packages'))).toBe(true);
    });

    it('counts no @cngx package outside the libs as a lib', async () => {
      const tree = createFixtureTree();
      for (const name of ['@cngx/mcp', '@cngx/eslint-plugin', '@cngx/themes']) {
        declare(tree, name);
      }

      const run = await runRule(ngAdd({ libs: 'core', theme: 'none', yes: true }), tree);

      expect(recordedLibs(run.tree)).toEqual(['core']);
      expect(run.logs.some((line) => line.startsWith('  - Keep the recorded packages'))).toBe(false);
    });

    it('changes nothing on a re-run after the pins cngx wrote for the peers', async () => {
      const first = await runRule(ngAdd({ libs: 'forms', yes: true }), createFixtureTree());

      const second = await runRule(ngAdd({ yes: true }), first.tree);

      expect(recordedLibs(second.tree)).toEqual(['forms']);
      expect(second.logs).toContain('cngx is already set up; nothing changed.');
    });

    it('plans no floor note on a first install that takes every lib', async () => {
      const run = await runRule(ngAdd({ yes: true }), createFixtureTree());

      expect(run.logs.some((line) => line.startsWith('  - Keep the recorded packages'))).toBe(false);
    });
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
    expect(run.logs).toContain('  - Skip .vscode/mcp.json - it has no servers object cngx can add to; add servers.cngx by hand');
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

  it('names a package.json that does not parse', async () => {
    const tree = createFixtureTree('standalone-app', { 'package.json': '{ "dependencies": ' });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow(/^package\.json is not valid JSON: .+\.$/);
  });

  it('names an angular.json without projects', async () => {
    const workspace = JSON.parse(readFixture('standalone-app')['angular.json']) as Record<string, unknown>;
    const tree = createFixtureTree('standalone-app', { 'angular.json': JSON.stringify({ ...workspace, projects: {} }) });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow('angular.json lists no projects.');
  });

  it('names a listed stylesheet that is missing on disk', async () => {
    const tree = createFixtureTree('standalone-app', {
      'angular.json': withWorkspace((project) => {
        project['architect']['build']['options']['styles'] = ['src/missing.css'];
      }),
    });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow(
      'src/missing.css is listed under styles in angular.json but does not exist; create it or remove the entry.',
    );
  });

  it('refuses a project without a build target', async () => {
    const tree = createFixtureTree('standalone-app', {
      'angular.json': withWorkspace((project) => {
        delete project['architect']['build'];
      }),
    });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow(
      'Project "fixture-app" has no build target in angular.json; cngx wires styles and providers through it.',
    );
  });

  it('changes nothing on a second run after an Angular patch bump', async () => {
    const installed = (version: string) => JSON.stringify({ name: '@angular/core', version });
    const first = await runRule(
      ngAdd({ yes: true }),
      createFixtureTree('standalone-app', { 'node_modules/@angular/core/package.json': installed('21.2.5') }),
    );
    first.tree.overwrite('node_modules/@angular/core/package.json', installed('21.2.6'));
    const record = first.tree.readContent('.cngx/install.json');

    const second = await runRule(ngAdd({ yes: true }), first.tree);

    expect(second.tree.readContent('.cngx/install.json')).toBe(record);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
  });

  it('refuses an older installed Angular behind a catalog specifier', async () => {
    const tree = createFixtureTree('standalone-app', {
      'package.json': withDependencies({ '@angular/core': 'catalog:' }),
      'node_modules/@angular/core/package.json': JSON.stringify({ name: '@angular/core', version: '19.2.3' }),
    });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow('cngx needs Angular 21.2 or newer; this app has 19.2.3 installed (declares catalog:).');
  });

  it('runs on when no Angular version can be read and pins the CDK to the installed version', async () => {
    const unreadable = await runRule(
      ngAdd({}),
      createFixtureTree('standalone-app', { 'package.json': withDependencies({ '@angular/core': 'workspace:*' }) }),
    );
    expect(json<{ dependencies: Record<string, string> }>(unreadable.tree, 'package.json').dependencies['@angular/cdk']).toBeUndefined();

    const installed = await runRule(
      ngAdd({}),
      createFixtureTree('standalone-app', {
        'package.json': withDependencies({ '@angular/core': 'catalog:' }),
        'node_modules/@angular/core/package.json': JSON.stringify({ name: '@angular/core', version: '21.2.5' }),
      }),
    );
    expect(json<{ dependencies: Record<string, string> }>(installed.tree, 'package.json').dependencies['@angular/cdk']).toBe('^21.2.0');
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

    expect(run.logs[0]).toMatch(/^cngx applied \d+ changes\.$/);
    expect(run.logs.some((line) => line.startsWith('Planned'))).toBe(false);
  });

  it('says planned instead of applied under --dry-run', async () => {
    const argv = process.argv;
    process.argv = [...argv.slice(0, 2), 'add', '@cngx/core', '--dry-run'];
    try {
      const run = await runRule(ngAdd({ quiet: true }), createFixtureTree());

      expect(run.logs[0]).toMatch(/^cngx planned \d+ changes\.$/);
    } finally {
      process.argv = argv;
    }
  });

  it('asks nothing without a terminal, even with prompts on', async () => {
    const run = await runRule(ngAdd({ prompts: true }), createFixtureTree());

    expect(run.tasks).toEqual(['node-package']);
    expect(run.logs.some((line) => line.includes('?'))).toBe(false);
  });

  // Before the install `ng add` parses flags without the schema's types, so
  // a list arrives as one comma string and `--lint=false` as "false".
  it('plans the flags ng add passes before the install like the typed ones', async () => {
    // install.json stamps the run time; both runs must see the same clock.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const typed = await runRule(
      ngAdd({ aiTools: ['claude', 'vscode'], libs: ['core', 'forms'], lint: false }),
      createFixtureTree(),
    );
    const scalar = await runRule(ngAdd({ aiTools: 'claude,vscode', libs: 'core,forms', lint: 'false' }), createFixtureTree());

    expect(scalar.logs).toEqual(typed.logs);
    expect(readTree(scalar.tree)).toEqual(readTree(typed.tree));
  });

  it('stops on an unknown or repeated list entry and names it', async () => {
    await expect(runRule(ngAdd({ aiTools: 'emacs' }), createFixtureTree())).rejects.toThrow(
      '"emacs" is not a valid answer for --ai-tools. Expected one of: claude, cursor, vscode.',
    );
    await expect(runRule(ngAdd({ aiTools: 'claude,claude' }), createFixtureTree())).rejects.toThrow(
      '"claude" is given more than once for --ai-tools.',
    );
  });
});

describe('the ng-add collection', () => {
  it('is a single stage with no setup schematic', () => {
    expect(Object.keys(COLLECTION.schematics)).toEqual(['ng-add']);
  });

  it('offers exactly the answer vocabulary the steps understand', () => {
    interface Branch {
      type?: string;
      enum?: readonly string[];
      items?: { enum?: readonly string[] };
    }
    const enums = SCHEMA.properties as Record<string, Branch & { oneOf?: readonly Branch[] }>;
    const listEnum = (key: string) => enums[key].oneOf?.find((branch) => branch.type === 'array')?.items?.enum;

    expect(enums['preset'].enum).toEqual(NG_ADD_PRESETS);
    expect(listEnum('libs')).toEqual(CNGX_LIBS);
    expect(enums['theme'].enum).toEqual(THEME_CHOICES);
    expect(enums['i18n'].enum).toEqual(LANGUAGES);
    expect(listEnum('aiTools')).toEqual(AI_TOOLS);
  });

  it('describes the editor configs the aiTools step writes', () => {
    const description = (SCHEMA.properties['aiTools'] as { description: string }).description;

    expect(description).toContain('project MCP config');
    expect(description).toContain('.cngx/README.md');
    expect(description).not.toContain('writes no editor config');
    expect(description).toContain('--preset=full');
  });

  it('names the MCP setup in the full preset label', () => {
    const full = PRESET_CHOICES.find((choice) => choice.value === 'full');

    expect(full?.name).toContain('MCP server');
  });

  it('declares the preset without an x-prompt or default, so the rule asks it after the preflight', () => {
    const preset = SCHEMA.properties['preset'] as Record<string, unknown>;

    expect(preset['x-prompt']).toBeUndefined();
    expect(preset['default']).toBeUndefined();
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
