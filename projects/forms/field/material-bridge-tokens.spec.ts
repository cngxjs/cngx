import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the field Material bridge
 * (`projects/themes/material/field-theme.scss`). The bridge's historic
 * defect was name drift - 12 of 18 written tokens had zero consumers -
 * so this spec pins the emitted token-name set against the names the
 * forms lib actually reads (hint/error/required colors, char-count
 * typography, and the sibling-scoped form-errors pair). Co-located with
 * the consumer because `projects/themes/material/` has no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('field Material bridge', () => {
  // every name is consumed by the forms field/input/form-errors CSS
  const CONSUMED = [
    '--cngx-field-char-count-font-size',
    '--cngx-field-error-color',
    '--cngx-field-hint-color',
    '--cngx-field-required-color',
    '--cngx-form-errors-color',
    '--cngx-form-errors-font-size',
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
