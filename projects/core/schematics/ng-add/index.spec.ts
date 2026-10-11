import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_ESLINT_PLUGIN_VERSION } from '../engine';
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
        '  Skip the eslint entry - no eslint flat config (eslint.config.js, .mjs or .cjs) found',
      );
      expect(run.tree.exists('eslint.config.js')).toBe(false);
    });
  });

  it('extends an eslint flat config and pins the plugin as a devDependency', async () => {
    const run = await runRule(ngAdd({}), createFixtureTree('standalone-app', { 'eslint.config.js': ESLINT_CONFIG }));

    expect(run.tree.readContent('eslint.config.js')).toContain("const cngx = require('@cngx/eslint-plugin');");
    expect(run.tree.readContent('eslint.config.js')).toContain('  ...cngx.configs.recommended,\n]);');
    expect(json<{ devDependencies: Record<string, string> }>(run.tree, 'package.json').devDependencies['@cngx/eslint-plugin']).toBe(
      DEFAULT_ESLINT_PLUGIN_VERSION,
    );
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

    it('states the git state before it applies', async () => {
      const run = await runRule(ngAdd({}), existing());

      expect(run.logs.filter((line) => line.startsWith('Git: '))).toHaveLength(1);
      expect(run.tree.exists('src/cngx-theme.css')).toBe(true);
    });

    it('skips the confirmation with --yes', async () => {
      const run = await runRule(ngAdd({ yes: true }), existing());

      expect(run.logs.some((line) => line.startsWith('Git: '))).toBe(false);
    });
  });

  it('notes the AI tooling a full run detects instead of dropping it silently', async () => {
    const run = await runRule(ngAdd({ preset: 'full' }), createFixtureTree('standalone-app', { 'CLAUDE.md': '# app\n' }));

    expect(run.logs).toContain(
      '  Skip the AI tooling configs - the MCP and agent configs for claude are not written by this release yet',
    );
  });

  it('refuses an Angular version below 21.2', async () => {
    const tree = createFixtureTree('standalone-app', { 'package.json': withDependencies({ '@angular/core': '^20.3.0' }) });

    await expect(runRule(ngAdd({}), tree)).rejects.toThrow('cngx needs Angular 21.2 or newer; this app declares ^20.3.0.');
  });

  it.each([
    ['a standalone css app', {}],
    ['a Material css app', MATERIAL_CSS_APP],
    ['a define-theme scss app', DEFINE_THEME_SCSS_APP],
    ['an app with an eslint config', { 'eslint.config.js': ESLINT_CONFIG }],
  ])('changes nothing on a second run over %s', async (_name, overrides) => {
    const first = await runRule(ngAdd({ preset: 'full' }), createFixtureTree('standalone-app', overrides));
    const files = first.tree.files.map((path) => [path, first.tree.readContent(path)]);

    const second = await runRule(ngAdd({ preset: 'full' }), first.tree);

    expect(second.tree.files.map((path) => [path, second.tree.readContent(path)])).toEqual(files);
    expect(second.tasks).toEqual([]);
    expect(second.logs).toContain('cngx is already set up; nothing changed.');
    expect(second.logs.some((line) => line.startsWith('Planned'))).toBe(false);
    expect(second.logs.some((line) => line.startsWith('Git: '))).toBe(false);
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
