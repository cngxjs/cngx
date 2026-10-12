import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../engine';
import { createFixtureTree } from '../../testing/run-schematic';
import { detectProject, type ProjectFacts } from './detect';

const MAP_API_THEME = `@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}
`;

const DEFINE_THEME = `@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$violet-palette),
  density: (scale: -2),
));

html {
  @include mat.all-component-themes($theme);
}
`;

const M2_THEME = `@use '@angular/material' as mat;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $primary)));
@include mat.all-component-themes($theme);
`;

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

const ZONED_CONFIG = `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })]
};
`;

const CONFIG_WITH_PROVIDERS = `import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()]
};
`;

const SECOND_COMPONENT = `import { Component } from '@angular/core';

@Component({ selector: 'app-other', template: '' })
export class Other {}
`;

function withWorkspaceStyles(styles: readonly unknown[], extra: Record<string, unknown> = {}): string {
  const workspace = JSON.parse(createFixtureTree().readText('angular.json')) as {
    projects: Record<string, { architect: { build: { options: Record<string, unknown> } } } & Record<string, unknown>>;
  };
  const project = workspace.projects['fixture-app'];
  project.architect.build.options = { ...project.architect.build.options, styles, ...extra };
  return JSON.stringify(workspace);
}

function withPackage(dependencies: Record<string, string>): string {
  const manifest = JSON.parse(createFixtureTree().readText('package.json')) as { dependencies: Record<string, string> };
  return JSON.stringify({ ...manifest, dependencies: { ...manifest.dependencies, ...dependencies } });
}

async function detect(overrides: Record<string, string> = {}, project?: string): Promise<ProjectFacts> {
  const tree = createFixtureTree('standalone-app', overrides);
  return detectProject(tree, await readWorkspace(tree), project);
}

describe('detectProject', () => {
  it('reads the stock standalone app', async () => {
    expect(await detect()).toEqual({
      project: 'fixture-app',
      manifest: parseManifest(createFixtureTree().readText('package.json')),
      sourceRoot: 'src',
      angularVersion: '21.2.0',
      bootstrap: 'standalone',
      zoneless: true,
      signalForms: false,
      stylesKind: 'css',
      stylesPath: 'src/styles.css',
      cngxStylesheet: false,
      cngxThemePath: undefined,
      appConfigPath: 'src/app/app.config.ts',
      rootProviders: ['provideBrowserGlobalErrorListeners', 'provideRouter'],
      material: { present: false, themeShape: 'none', themePath: undefined, themeVariable: undefined, density: 0 },
      editors: { claude: false, cursor: false, vscode: false },
      mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'absent' },
      mcpPins: { claude: undefined, cursor: undefined, vscode: undefined },
      agentsMd: 'absent',
      claudeInstructions: undefined,
      helperReadme: undefined,
      eslintConfig: undefined,
      ssr: false,
      sourceLocale: undefined,
      maturity: 'fresh',
    } satisfies ProjectFacts);
  });

  it('resolves the named project and refuses an unknown one', async () => {
    expect((await detect({}, 'fixture-app')).project).toBe('fixture-app');
    await expect(detect({}, 'missing')).rejects.toThrow('Project "missing" not found in angular.json.');
  });

  it('refuses a library project', async () => {
    const workspace = JSON.parse(createFixtureTree().readText('angular.json')) as {
      projects: Record<string, Record<string, unknown>>;
    };
    workspace.projects['fixture-app']['projectType'] = 'library';
    await expect(detect({ 'angular.json': JSON.stringify(workspace) })).rejects.toThrow(
      'Project "fixture-app" is a library; cngx ng-add sets up an application.',
    );
  });

  it('reads the Angular version from the declared @angular/core range', async () => {
    expect((await detect({ 'package.json': withPackage({ '@angular/core': '~21.2.3' }) })).angularVersion).toBe(
      '21.2.3',
    );
    expect((await detect({ 'package.json': JSON.stringify({ dependencies: {} }) })).angularVersion).toBeUndefined();
  });

  it('detects an NgModule bootstrap and its module as the provider target', async () => {
    const facts = await detect({ 'src/main.ts': NGMODULE_MAIN });
    expect(facts.bootstrap).toBe('ngmodule');
    expect(facts.appConfigPath).toBe('src/app/app-module.ts');
  });

  it('follows the app config import of main.ts', async () => {
    const main = createFixtureTree().readText('src/main.ts').replace("'./app/app.config'", "'./config/root.config'");
    expect((await detect({ 'src/main.ts': main })).appConfigPath).toBe('src/config/root.config.ts');
  });

  it('detects zone-based change detection from polyfills or the app config', async () => {
    expect((await detect({ 'angular.json': withWorkspaceStyles(['src/styles.css'], { polyfills: ['zone.js'] }) })).zoneless).toBe(
      false,
    );
    expect((await detect({ 'src/app/app.config.ts': ZONED_CONFIG })).zoneless).toBe(false);
  });

  it('detects Signal Forms from an import under the source root', async () => {
    const facts = await detect({
      'src/app/form.ts': "import { form } from '@angular/forms/signals';\nexport const f = form;\n",
    });
    expect(facts.signalForms).toBe(true);
  });

  it('reads the global stylesheet kind from the first build style entry', async () => {
    const facts = await detect({
      'angular.json': withWorkspaceStyles([{ input: 'src/styles.scss', bundleName: 'styles' }]),
      'src/styles.scss': '',
    });
    expect(facts.stylesKind).toBe('scss');
    expect(facts.stylesPath).toBe('src/styles.scss');
  });

  it('reads no stylesheet when the build has no style entry', async () => {
    const facts = await detect({ 'angular.json': withWorkspaceStyles([]) });
    expect(facts.stylesPath).toBeUndefined();
    expect(facts.stylesKind).toBe('css');
  });

  describe('Material', () => {
    it('reads the map API from the global stylesheet of an scss app', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles(['src/styles.scss']),
        'src/styles.scss': MAP_API_THEME,
      });
      expect(facts.material).toEqual({
        present: true,
        themeShape: 'map-api',
        themePath: 'src/styles.scss',
        themeVariable: undefined,
        density: 0,
      });
    });

    it('reads the map API from the separate theme file Material writes for a css app', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles(['src/material-theme.scss', 'src/styles.css']),
        'src/material-theme.scss': MAP_API_THEME.replace('density: 0', 'density: -2'),
      });
      expect(facts.stylesKind).toBe('css');
      expect(facts.stylesPath).toBe('src/styles.css');
      expect(facts.material).toEqual({
        present: true,
        themeShape: 'map-api',
        themePath: 'src/material-theme.scss',
        themeVariable: undefined,
        density: -2,
      });
    });

    it('honours a custom @use namespace', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles(['src/styles.scss']),
        'src/styles.scss': MAP_API_THEME.replace("as mat;", 'as material;').replace('@include mat.theme', '@include material.theme'),
      });
      expect(facts.material.themeShape).toBe('map-api');
    });

    it('reads a define-theme object and its density scale', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles(['src/styles.scss']),
        'src/styles.scss': DEFINE_THEME,
      });
      expect(facts.material).toEqual({
        present: true,
        themeShape: 'define-theme',
        themePath: 'src/styles.scss',
        themeVariable: 'theme',
        density: -2,
      });
    });

    it('reads an M2 theme', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles(['src/styles.scss']),
        'src/styles.scss': M2_THEME,
      });
      expect(facts.material.themeShape).toBe('m2');
      expect(facts.material.themeVariable).toBe('theme');
    });

    it('reads a prebuilt theme entry', async () => {
      const facts = await detect({
        'package.json': withPackage({ '@angular/material': '^21.2.0' }),
        'angular.json': withWorkspaceStyles([
          '@angular/material/prebuilt-themes/azure-blue.css',
          'src/styles.css',
        ]),
      });
      expect(facts.material).toEqual({
        present: true,
        themeShape: 'prebuilt',
        themePath: '@angular/material/prebuilt-themes/azure-blue.css',
        themeVariable: undefined,
        density: 0,
      });
      expect(facts.stylesPath).toBe('src/styles.css');
    });

    it('reports no theme when Material is installed but unthemed', async () => {
      const facts = await detect({ 'package.json': withPackage({ '@angular/material': '^21.2.0' }) });
      expect(facts.material).toEqual({
        present: true,
        themeShape: 'none',
        themePath: undefined,
        themeVariable: undefined,
        density: 0,
      });
    });
  });

  describe('cngx theme wiring', () => {
    it('sees cngx.css imported by a global stylesheet or listed as a style entry', async () => {
      expect((await detect({ 'src/styles.css': "@import '@cngx/themes/cngx.css';\n" })).cngxStylesheet).toBe(true);
      expect(
        (await detect({ 'angular.json': withWorkspaceStyles(['@cngx/themes/cngx.css', 'src/styles.css']) })).cngxStylesheet,
      ).toBe(true);
      const inThemeFile = await detect({
        'angular.json': withWorkspaceStyles(['src/material-theme.scss', 'src/styles.css']),
        'src/material-theme.scss': `@import '@cngx/themes/cngx.css';\n${DEFINE_THEME}`,
      });
      expect(inThemeFile.cngxStylesheet).toBe(true);
    });

    it('finds a generated theme file or a stylesheet already using the Material bridge', async () => {
      expect((await detect({ 'src/cngx-theme.css': '' })).cngxThemePath).toBe('src/cngx-theme.css');
      const bridged = await detect({
        'angular.json': withWorkspaceStyles(['src/styles.scss']),
        'src/styles.scss': `${DEFINE_THEME}@use '@cngx/themes/material/theme' as cngx-material;\n`,
      });
      expect(bridged.cngxThemePath).toBe('src/styles.scss');
    });
  });

  it('detects editor folders', async () => {
    const facts = await detect({
      '.claude/settings.json': '{}',
      'CLAUDE.md': '',
      '.cursor/rules/x.mdc': '',
      '.vscode/extensions.json': '{}',
    });
    expect(facts.editors).toEqual({ claude: true, cursor: true, vscode: true });
    expect((await detect({ 'CLAUDE.md': '' })).editors.claude).toBe(true);
  });

  it('reads each editor mcp config under its own key, comments included', async () => {
    const facts = await detect({
      '.mcp.json': JSON.stringify({ mcpServers: { other: { command: 'other' } } }),
      '.cursor/mcp.json': JSON.stringify({ mcpServers: { cngx: { command: 'npx' } } }),
      '.vscode/mcp.json': '// workspace servers\n{ "servers": { "cngx": { "command": "npx" } } }',
    });
    expect(facts.mcpConfigs).toEqual({ claude: 'present', cursor: 'wired', vscode: 'wired' });
  });

  it('does not take a cngx server under the wrong key as wired', async () => {
    const facts = await detect({ '.vscode/mcp.json': JSON.stringify({ mcpServers: { cngx: {} } }) });
    expect(facts.mcpConfigs.vscode).toBe('present');
  });

  it('marks an mcp config that is not a JSON object as invalid', async () => {
    const facts = await detect({ '.mcp.json': '{ "mcpServers": ', '.cursor/mcp.json': '[]' });
    expect(facts.mcpConfigs).toMatchObject({ claude: 'invalid', cursor: 'invalid' });
  });

  it('reads the @cngx/mcp version an existing cngx entry pins', async () => {
    const facts = await detect({
      '.mcp.json': JSON.stringify({ mcpServers: { cngx: { command: 'npx', args: ['-y', '@cngx/mcp@0.2.0'] } } }),
      '.vscode/mcp.json': JSON.stringify({ servers: { cngx: { command: 'cngx-mcp' } } }),
    });
    expect(facts.mcpPins).toEqual({ claude: '0.2.0', cursor: undefined, vscode: undefined });
  });

  it('marks a servers key cngx cannot add an entry to as invalid', async () => {
    const facts = await detect({
      '.mcp.json': JSON.stringify({ mcpServers: null }),
      '.cursor/mcp.json': JSON.stringify({ mcpServers: 'none' }),
      '.vscode/mcp.json': JSON.stringify({ servers: [] }),
    });
    expect(facts.mcpConfigs).toEqual({ claude: 'invalid', cursor: 'invalid', vscode: 'invalid' });
  });

  it('finds the cngx block in AGENTS.md', async () => {
    expect((await detect({ 'AGENTS.md': '# Agents\n' })).agentsMd).toBe('present');
    expect((await detect({ 'AGENTS.md': '# Agents\n<!-- cngx:agents -->\n' })).agentsMd).toBe('wired');
  });

  it('finds the Claude Code instructions in the root first, then where ng new --ai-config puts them', async () => {
    expect((await detect({ '.claude/CLAUDE.md': '# Rules\n' })).claudeInstructions).toEqual({
      path: '.claude/CLAUDE.md',
      state: 'present',
    });
    expect(
      (await detect({ 'CLAUDE.md': '<!-- cngx:agents -->\n', '.claude/CLAUDE.md': '# Rules\n' })).claudeInstructions,
    ).toEqual({ path: 'CLAUDE.md', state: 'wired' });
  });

  it('tells a generated helper readme from one someone else wrote', async () => {
    const generated = await detect({ '.cngx/README.md': '<!-- cngx:generated 0123abcd -->\n# cngx\n' });
    const foreign = await detect({ '.cngx/README.md': '# Notes\n' });

    expect(generated.helperReadme).toEqual({ generated: true, fingerprint: expect.stringMatching(/^[0-9a-f]{8}$/) });
    expect(foreign.helperReadme?.generated).toBe(false);
  });

  it('finds the eslint flat config in js, mjs or cjs', async () => {
    expect((await detect({ 'eslint.config.mjs': 'export default [];' })).eslintConfig).toEqual({
      path: 'eslint.config.mjs',
      module: 'esm',
      editable: true,
      wired: false,
    });
    expect((await detect({ 'eslint.config.cjs': 'module.exports = [];' })).eslintConfig?.module).toBe('cjs');
    expect((await detect({ '.eslintrc.json': '{}' })).eslintConfig).toBeUndefined();
  });

  it('reads the module format, editability and cngx wiring of an eslint.config.js', async () => {
    const angularEslint = `// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  { files: ["**/*.ts"] },
]);
`;
    expect((await detect({ 'eslint.config.js': angularEslint })).eslintConfig).toEqual({
      path: 'eslint.config.js',
      module: 'cjs',
      editable: true,
      wired: false,
    });
    const esm = "import cngx from '@cngx/eslint-plugin';\nexport default tseslint.config({ files: [] });\n";
    expect((await detect({ 'eslint.config.js': esm })).eslintConfig).toEqual({
      path: 'eslint.config.js',
      module: 'esm',
      editable: false,
      wired: true,
    });
  });

  it('detects SSR from the build options or the @angular/ssr dependency', async () => {
    expect((await detect({ 'angular.json': withWorkspaceStyles(['src/styles.css'], { server: 'src/main.server.ts' }) })).ssr).toBe(
      true,
    );
    expect((await detect({ 'package.json': withPackage({ '@angular/ssr': '^21.2.0' }) })).ssr).toBe(true);
  });

  it('reads the i18n source locale in both workspace shapes', async () => {
    const workspace = (sourceLocale: unknown): string => {
      const parsed = JSON.parse(createFixtureTree().readText('angular.json')) as {
        projects: Record<string, Record<string, unknown>>;
      };
      parsed.projects['fixture-app']['i18n'] = { sourceLocale };
      return JSON.stringify(parsed);
    };
    expect((await detect({ 'angular.json': workspace('ar') })).sourceLocale).toBe('ar');
    expect((await detect({ 'angular.json': workspace({ code: 'he', baseHref: '/he/' }) })).sourceLocale).toBe('he');
  });

  describe('maturity', () => {
    it('calls an app with more than the root component existing', async () => {
      expect((await detect({ 'src/app/other.ts': SECOND_COMPONENT })).maturity).toBe('existing');
    });

    it('calls an app with another UI library existing', async () => {
      for (const library of ['@angular/material', 'primeng', 'tailwindcss', 'bootstrap']) {
        expect((await detect({ 'package.json': withPackage({ [library]: '*' }) })).maturity).toBe('existing');
      }
    });

    it('calls an app with providers beyond the scaffold existing', async () => {
      expect((await detect({ 'src/app/app.config.ts': CONFIG_WITH_PROVIDERS })).maturity).toBe('existing');
    });

    it('keeps the scaffold providers fresh', async () => {
      expect((await detect({ 'src/app/app.config.ts': ZONED_CONFIG })).maturity).toBe('fresh');
    });
  });

  it('reads each source file and stylesheet once', async () => {
    const tree = createFixtureTree('standalone-app', {
      'src/app/other.ts': SECOND_COMPONENT,
      'package.json': withPackage({ '@angular/material': '^21.2.0' }),
      'angular.json': withWorkspaceStyles(['src/material-theme.scss', 'src/styles.scss']),
      'src/material-theme.scss': MAP_API_THEME,
      'src/styles.scss': '',
    });
    const workspace = await readWorkspace(tree);
    const reads = new Map<string, number>();
    const readText = tree.readText.bind(tree);
    tree.readText = (path: string) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readText(path);
    };

    detectProject(tree, workspace);

    expect([...reads].filter(([, count]) => count > 1)).toEqual([]);
  });

  it('leaves the tree untouched', async () => {
    const tree = createFixtureTree();
    const before = tree.files.map((path) => [path, tree.readText(path)]);
    detectProject(tree, await readWorkspace(tree));
    expect(tree.files.map((path) => [path, tree.readText(path)])).toEqual(before);
  });
});
