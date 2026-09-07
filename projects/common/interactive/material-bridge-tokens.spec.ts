import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the Material bridges whose consumers live in
 * `@cngx/common/interactive` (+ the shared indicator atoms in
 * `@cngx/common/display`). The bridges' historic defect class is name
 * drift - writing `--cngx-*` custom properties no component reads - so
 * these specs pin the exact emitted token-name set against the names
 * grep-verified in the component stylesheets. Rendered-value coverage
 * (inherits:false placement) is the snapshot harness's job; this file
 * guards the name surface only.
 *
 * Co-located with the consumer (mirrors `material-theme.snapshot.spec.ts`
 * next to the ui organisms) because `projects/themes/material/` carries
 * no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function emittedTokenNames(bridge: string, themeVersion: 'v1' | 'v0'): string[] {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/${bridge}' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/${bridge}' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('interactive-controls Material bridge', () => {
  // every name is consumed by checkbox-indicator.component.css,
  // radio-indicator.component.css, or toggle.component.css
  const CONSUMED = [
    '--cngx-checkbox-border',
    '--cngx-checkbox-checked-bg',
    '--cngx-checkbox-checked-color',
    '--cngx-radio-indicator-checked-color',
    '--cngx-radio-indicator-color',
    '--cngx-toggle-thumb-bg',
    '--cngx-toggle-track-bg-off',
    '--cngx-toggle-track-bg-on',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('interactive-controls-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('interactive-controls-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});
