import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the treetable Material bridge
 * (`projects/themes/material/treetable-theme.scss`). Pins the emitted
 * token-name set against the names treetable.component.css actually
 * reads - the bridge's historic dead tokens were `--cngx-treetable-bg`
 * and `--cngx-treetable-row-color` (real name: `-cell-color`).
 */

function bridgeTokenNames(themeVersion: 'v1' | 'v0'): readonly string[] {
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
  return emittedTokenNames(compileThemeEntry(entry));
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
    expect(bridgeTokenNames('v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = bridgeTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});
