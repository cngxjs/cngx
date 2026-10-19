import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { createProvenanceStamp, parseManifest } from '../../engine';
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

async function detect(overrides: Record<string, string> = {}): Promise<ProjectFacts> {
  const tree = createFixtureTree('standalone-app', overrides);
  return detectProject(tree, await readWorkspace(tree));
}

describe('detectProject', () => {
  it('reads the stock standalone app', async () => {
    expect(await detect()).toEqual({
      project: 'fixture-app',
      applications: ['fixture-app'],
      manifest: parseManifest(createFixtureTree().readText('package.json')),
      sourceRoot: 'src',
      hasBuildTarget: true,
      angularVersion: '21.2.0',
      angularSource: 'range',
      angularRange: '^21.2.0',
      stylesPath: 'src/styles.css',
      missingStyleEntries: [],
      cngxStylesheet: false,
      cngxThemePath: undefined,
      cngxThemeListed: false,
      tailwind: undefined,
      rootProvidersFile: 'src/app/app.config.ts',
      rootProviders: ['provideBrowserGlobalErrorListeners', 'provideRouter'],
      appShell: {
        kind: 'followed',
        componentFile: 'src/app/app.ts',
        className: 'App',
        template: { kind: 'file', path: 'src/app/app.html' },
        importsHost: { file: 'src/app/app.ts', kind: 'component', className: 'App' },
        specPath: 'src/app/app.spec.ts',
        spec: 'absent',
        outlets: { kind: 'editable', elements: [], classes: [], routerOutlet: true },
      },
      scaffold: { kind: 'custom' },
      indexHtml: { path: 'src/index.html', state: 'untouched' },
      languageFile: 'absent',
      languagePack: undefined,
      material: { present: false, themeShape: 'none', themePath: undefined, themeVariable: undefined, density: 0 },
      editors: { claude: false, cursor: false, vscode: false },
      mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'absent' },
      mcpPins: { claude: undefined, cursor: undefined, vscode: undefined },
      agentsMd: 'absent',
      claudeInstructions: undefined,
      helperReadme: undefined,
      eslintConfig: undefined,
      legacyEslintConfig: undefined,
      eslintStack: { eslintMajor: undefined, templateParser: false, typescriptParser: false, angularEslint: undefined, templateParserMajor: undefined },
      sourceLocale: undefined,
      maturity: 'fresh',
    } satisfies ProjectFacts);
  });

  it('reads the root component and its stock spec of an untouched ng new app', async () => {
    const tree = createFixtureTree('scaffold-21');
    const facts = detectProject(tree, await readWorkspace(tree));

    expect(facts.appShell).toMatchObject({ componentFile: 'src/app/app.ts', className: 'App', spec: 'stock' });
    expect(facts.scaffold).toEqual({
      kind: 'untouched',
      files: { component: 'src/app/app.ts', template: 'src/app/app.html', stylesheet: 'src/app/app.css' },
      routing: true,
    });
    expect(facts.indexHtml).toEqual({ path: 'src/index.html', state: 'untouched' });
  });

  it('reads the index.html the build names', async () => {
    const tree = createFixtureTree('scaffold-21');
    const workspace = JSON.parse(tree.readText('angular.json')) as { projects: Record<string, { architect: { build: { options: Record<string, unknown> } } }> };
    workspace.projects['fixture-app'].architect.build.options['index'] = { input: 'src/main.html' };
    tree.overwrite('angular.json', JSON.stringify(workspace));
    tree.create('src/main.html', tree.readText('src/index.html'));

    expect(detectProject(tree, await readWorkspace(tree)).indexHtml).toEqual({ path: 'src/main.html', state: 'untouched' });
  });

  it('reads the Angular version from the installed package and the range from either dependency map', async () => {
    const manifest = JSON.parse(createFixtureTree().readText('package.json')) as {
      dependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const { '@angular/core': _core, ...dependencies } = manifest.dependencies;
    const facts = await detect({
      'package.json': JSON.stringify({ ...manifest, dependencies, devDependencies: { '@angular/core': 'catalog:' } }),
      'node_modules/@angular/core/package.json': JSON.stringify({ name: '@angular/core', version: '21.2.5' }),
    });

    expect(facts.angularRange).toBe('catalog:');
    expect(facts.angularVersion).toBe('21.2.5');
    expect(facts.angularSource).toBe('installed');
  });

  it('lists the local styles entries that are missing on disk', async () => {
    const facts = await detect({
      'angular.json': withWorkspaceStyles(['src/styles.css', 'src/missing.scss', '@angular/material/prebuilt-themes/azure-blue.css']),
    });

    expect(facts.missingStyleEntries).toEqual(['src/missing.scss']);
  });

  it('reads the existing tailwind app as an existing scss app without eslint', async () => {
    const tree = createFixtureTree('existing-tailwind-app');
    const facts = detectProject(tree, await readWorkspace(tree));

    expect(facts).toMatchObject({
      project: 'tailwind-app',
      stylesPath: 'src/styles.scss',
      missingStyleEntries: [],
      tailwind: { major: 4, layered: true, orderTarget: 'src/styles.scss', orderDeclared: false, layersFile: 'absent' },
      rootProviders: [
        'provideBrowserGlobalErrorListeners',
        'provideRouter',
        'provideHttpClient',
        'provideAppInitializer',
      ],
      eslintConfig: undefined,
      maturity: 'existing',
    });
  });

  it('tells a generated language file next to the app config from one someone else wrote', async () => {
    const generated = await detect({
      'src/app/cngx-language.ts': `${createProvenanceStamp('ng-add providers', '0.1.0')}export const cngxLanguagePack = 1;\n`,
    });
    expect(generated.languageFile).toBe('generated');

    const foreign = await detect({ 'src/app/cngx-language.ts': 'export const language = 1;\n' });
    expect(foreign.languageFile).toBe('foreign');
  });

  it('reads the language pack the app config passes', async () => {
    const config = `import { ApplicationConfig } from '@angular/core';
import { provideCngxI18n, withPack } from '@cngx/core/i18n';
import { CNGX_LANGUAGE_DE } from '@cngx/core/i18n/de';

export const appConfig: ApplicationConfig = {
  providers: [provideCngxI18n(withPack(CNGX_LANGUAGE_DE))]
};
`;

    expect((await detect({ 'src/app/app.config.ts': config })).languagePack).toEqual({
      text: 'CNGX_LANGUAGE_DE',
      name: 'CNGX_LANGUAGE_DE',
      module: '@cngx/core/i18n/de',
    });
  });

  describe('cngx theme wiring', () => {
    it('sees a generated theme listed in the build styles even when the file is gone', async () => {
      const listed = await detect({ 'angular.json': withWorkspaceStyles(['src/styles.css', 'src/cngx-theme.css']) });

      expect(listed.cngxThemeListed).toBe(true);
      expect(listed.cngxThemePath).toBeUndefined();
      expect((await detect({})).cngxThemeListed).toBe(false);
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

  describe('maturity', () => {
    it('calls an app with more than the root component existing', async () => {
      expect((await detect({ 'src/app/other.ts': SECOND_COMPONENT })).maturity).toBe('existing');
    });

    it('counts components anywhere under the source root', async () => {
      expect((await detect({ 'src/features/other.ts': SECOND_COMPONENT })).maturity).toBe('existing');
    });

    it('skips components in node_modules and dist folders', async () => {
      const facts = await detect({
        'src/node_modules/lib/other.ts': SECOND_COMPONENT,
        'src/dist/other.ts': SECOND_COMPONENT,
      });

      expect(facts.maturity).toBe('fresh');
    });

    it('counts a dist folder deeper in the source as source, like the rename walk', async () => {
      expect((await detect({ 'src/app/dist/page.ts': SECOND_COMPONENT })).maturity).toBe('existing');
      expect((await detect({ 'src/.angular/cache/other.ts': SECOND_COMPONENT })).maturity).toBe('fresh');
    });

    it('ignores a provider in a comment or a string', async () => {
      const config = `import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// provideFeedback(withToasts()),
const hint = 'provideFeedback(';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()]
};
`;

      const facts = await detect({ 'src/app/app.config.ts': config });

      expect(facts.rootProviders).toEqual(['provideBrowserGlobalErrorListeners']);
      expect(facts.maturity).toBe('fresh');
    });

    it('still counts a real provider call', async () => {
      const facts = await detect({ 'src/app/app.config.ts': CONFIG_WITH_PROVIDERS });

      expect(facts.rootProviders).toEqual(['provideBrowserGlobalErrorListeners', 'provideHttpClient']);
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
