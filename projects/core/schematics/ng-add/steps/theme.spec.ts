import { describe, expect, it } from 'vitest';

import { type Change, hasProvenanceStamp, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { type MaterialFacts } from '../detect/detect';
import { planTheme, renderDefaultTheme } from './theme';
import { BASE_TOKENS } from './theme-tokens.generated';

function byId(result: StepResult, id: string): Change | undefined {
  return result.changes.find((change) => change.id === id);
}

function material(overrides: Partial<MaterialFacts>): MaterialFacts {
  return {
    present: true,
    themeShape: 'map-api',
    themePath: 'src/material-theme.scss',
    themeVariable: undefined,
    density: 0,
    ...overrides,
  };
}

function content(change: Change | undefined): string {
  return change?.kind === 'create-file' ? change.content : '';
}

describe('planTheme', () => {
  it('imports cngx.css into the global stylesheet and adds the default theme after it', () => {
    const result = planTheme(createFacts(), createAnswers(), VERSIONS);

    expect(result.changes.map((change) => [change.id, change.kind])).toEqual([
      ['theme:stylesheet', 'add-style-import'],
      ['theme:file', 'create-file'],
      ['theme:entry', 'add-style-entry'],
    ]);
    expect(byId(result, 'theme:stylesheet')).toMatchObject({
      path: 'src/styles.css',
      statement: "@import '@cngx/themes/cngx.css';",
    });
    expect(byId(result, 'theme:file')).toMatchObject({ path: 'src/cngx-theme.css' });
    expect(byId(result, 'theme:entry')).toMatchObject({
      project: 'fixture-app',
      path: 'src/cngx-theme.css',
      after: 'src/styles.css',
    });
  });

  it('lists cngx.css as a style entry when the build has no global stylesheet', () => {
    const result = planTheme(createFacts({ stylesPath: undefined }), createAnswers(), VERSIONS);

    expect(byId(result, 'theme:stylesheet')).toMatchObject({
      kind: 'add-style-entry',
      path: '@cngx/themes/cngx.css',
    });
    expect(byId(result, 'theme:entry')).toMatchObject({ after: '@cngx/themes/cngx.css' });
  });

  it('plans nothing for theme none or when @cngx/themes cannot be installed', () => {
    expect(planTheme(createFacts(), createAnswers({ theme: 'none' }), VERSIONS)).toEqual({ changes: [], skipped: [] });
    expect(planTheme(createFacts(), createAnswers({ libs: ['forms'] }), VERSIONS)).toEqual({ changes: [], skipped: [] });
  });

  it('skips what is already wired', () => {
    const result = planTheme(
      createFacts({ cngxStylesheet: true, cngxThemePath: 'src/cngx-theme.css' }),
      createAnswers(),
      VERSIONS,
    );

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      ['theme:stylesheet', 'already imported'],
      ['theme:file', 'already wired in src/cngx-theme.css'],
      ['theme:entry', 'already wired in src/cngx-theme.css'],
    ]);
  });

  describe('the default theme file', () => {
    const file = renderDefaultTheme(VERSIONS.cngx);

    it('is provenance-stamped and overrides inside the cngx.theme layer', () => {
      expect(hasProvenanceStamp(file)).toBe(true);
      expect(file).toContain('@layer cngx.theme {');
      expect(file).toContain(':root {');
    });

    it('carries every base token as a commented declaration with its default', () => {
      for (const token of BASE_TOKENS) {
        expect(file).toContain(`/* ${token.name}: ${token.initialValue}; */`);
      }
    });

    it('says which values a token accepts and where a non-inheriting one must be set', () => {
      expect(file).toContain('Accepts <length>. Default 8px. Inherits.');
      const local = BASE_TOKENS.find((token) => !token.inherits);
      if (local !== undefined) {
        expect(file).toContain(`Default ${local.initialValue}. Does not inherit: set it on the element that reads it.`);
      }
    });

    it('never closes a comment inside a token description', () => {
      const body = file.slice(file.indexOf(':root {'));
      expect(body.split('\n').filter((line) => line.includes('*/') && !line.trim().endsWith('*/'))).toEqual([]);
    });

    it('wraps comment lines and carries no em-dash', () => {
      expect(file.split('\n').every((line) => line.length <= 100)).toBe(true);
      expect(file).not.toContain(String.fromCodePoint(0x2014));
    });
  });

  describe('the Material bridge', () => {
    it('bridges the map API in its own scss file after the global stylesheet', () => {
      const facts = createFacts({ material: material({ density: -2 }) });
      const result = planTheme(facts, createAnswers({ theme: 'material' }), VERSIONS);
      const file = content(byId(result, 'theme:file'));

      expect(byId(result, 'theme:file')).toMatchObject({ path: 'src/cngx-theme.scss' });
      expect(file).toContain("@use '@cngx/themes/material/theme' as cngx-material;");
      expect(file).toContain('  @include cngx-material.theme-system(-2);');
      expect(file).toContain('src/material-theme.scss');
      expect(hasProvenanceStamp(file)).toBe(true);
      expect(byId(result, 'theme:entry')).toMatchObject({ path: 'src/cngx-theme.scss', after: 'src/styles.css' });
    });

    it('bridges a theme object in the file that defines it, with cngx.css loaded first', () => {
      const facts = createFacts({
        material: material({ themeShape: 'define-theme', themeVariable: 'app-theme', density: -1 }),
      });
      const result = planTheme(facts, createAnswers({ theme: 'material' }), VERSIONS);

      expect(result.changes.map((change) => [change.id, change.kind])).toEqual([
        ['theme:stylesheet', 'add-style-import'],
        ['theme:bridge-import', 'add-style-import'],
        ['theme:bridge', 'edit-file'],
      ]);
      expect(byId(result, 'theme:stylesheet')).toMatchObject({ path: 'src/material-theme.scss' });
      expect(byId(result, 'theme:bridge-import')).toMatchObject({
        path: 'src/material-theme.scss',
        statement: "@use '@cngx/themes/material/theme' as cngx-material;",
      });
      const bridge = byId(result, 'theme:bridge');
      const edited = bridge?.kind === 'edit-file' ? bridge.edit('html {}\n') : '';
      expect(edited).toBe(
        'html {}\n\nhtml {\n  @include cngx-material.theme($app-theme); /* cngx:theme:bridge */\n}\n',
      );
      expect(bridge?.kind === 'edit-file' ? bridge.edit(edited) : '').toBe(edited);
    });

    it('bridges an M2 theme object the same way', () => {
      const facts = createFacts({ material: material({ themeShape: 'm2', themeVariable: 'theme' }) });
      expect(byId(planTheme(facts, createAnswers({ theme: 'material' }), VERSIONS), 'theme:bridge')).toBeDefined();
    });

    it('falls back to the default theme when there is nothing to bridge', () => {
      for (const facts of [
        createFacts(),
        createFacts({ material: material({ themeShape: 'prebuilt', themePath: '@angular/material/prebuilt-themes/x.css' }) }),
        createFacts({ material: material({ themeShape: 'define-theme', themeVariable: undefined }) }),
      ]) {
        const result = planTheme(facts, createAnswers({ theme: 'material' }), VERSIONS);
        expect(byId(result, 'theme:material')).toMatchObject({ kind: 'note', label: 'Use the cngx default theme' });
        expect(byId(result, 'theme:file')).toMatchObject({ path: 'src/cngx-theme.css' });
      }
    });
  });

  it('stamps every change with its provenance and does not mutate its inputs', () => {
    const facts = deepFreeze(createFacts({ material: material({ themeShape: 'define-theme', themeVariable: 'theme' }) }));
    const result = planTheme(facts, deepFreeze(createAnswers({ theme: 'material' })), deepFreeze(VERSIONS));
    expect(result.changes.every((change) => change.provenance.source === 'ng-add')).toBe(true);
  });
});
