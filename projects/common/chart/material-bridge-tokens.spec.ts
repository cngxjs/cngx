import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the chart Material bridge
 * (`projects/themes/material/chart-theme.scss`). Pins the emitted
 * token-name set against the names registered in chart-tokens.css -
 * the bridge's historic defect was writing `--cngx-chart-accent` and a
 * tooltip pair no chart file reads. Co-located with the consumer
 * because `projects/themes/material/` has no test target.
 */

function bridgeTokenNames(themeVersion: 'v1' | 'v0'): readonly string[] {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/chart-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/chart-theme' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;
  return emittedTokenNames(compileThemeEntry(entry));
}

describe('chart Material bridge', () => {
  // every name is registered and consumed via chart-tokens.css
  const CONSUMED = [
    '--cngx-chart-axis-color',
    '--cngx-chart-danger',
    '--cngx-chart-grid-color',
    '--cngx-chart-primary',
    '--cngx-chart-text-color',
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
