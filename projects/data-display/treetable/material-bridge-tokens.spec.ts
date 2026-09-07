import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the treetable Material bridge
 * (`projects/themes/material/treetable-theme.scss`). Pins the emitted
 * token-name set against the names treetable.component.css actually
 * reads - the bridge's historic dead tokens were `--cngx-treetable-bg`
 * and `--cngx-treetable-row-color` (real name: `-cell-color`).
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const theme =
    themeVersion === 'v1'
      ? `$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));`
      : `$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));`;
  const entry = `
@use '@angular/material' as mat;
@use 'material/treetable-theme' as bridge;

${theme}

@include bridge.theme($theme);
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('treetable Material bridge', () => {
  // every name is consumed by treetable.component.css
  const CONSUMED = [
    '--cngx-treetable-cell-color',
    '--cngx-treetable-header-bg',
    '--cngx-treetable-header-color',
    '--cngx-treetable-row-border',
    '--cngx-treetable-row-hover-bg',
    '--cngx-treetable-row-selected-bg',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});
