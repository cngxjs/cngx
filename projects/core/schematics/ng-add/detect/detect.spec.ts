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
      manifest: parseManifest(createFixtureTree().readText('package.json')),
      sourceRoot: 'src',
      angularVersion: '21.2.0',
      stylesPath: 'src/styles.css',
      cngxStylesheet: false,
      cngxThemePath: undefined,
      cngxThemeListed: false,
      tailwind: undefined,
      appConfigPath: 'src/app/app.config.ts',
      rootProviders: ['provideBrowserGlobalErrorListeners', 'provideRouter'],
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

  it('reads the existing tailwind app as an existing scss app without eslint', async () => {
    const tree = createFixtureTree('existing-tailwind-app');
    const facts = detectProject(tree, await readWorkspace(tree));

    expect(facts).toMatchObject({
      project: 'tailwind-app',
      stylesPath: 'src/styles.scss',
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

    it('counts only components under the app folder', async () => {
      expect((await detect({ 'src/lib/other.ts': SECOND_COMPONENT })).maturity).toBe('fresh');
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
