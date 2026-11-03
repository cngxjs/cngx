import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

// The strong fill pairs travel as a unit: a bridge that maps the fill without
// its ink leaves Material fills under the cngx default ink for every reader
// outside the button host (select chips, the dragged chip).

function compile(theme: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;

html {
  @include cngx-system.theme(${theme});
}
`);
}

const PAIRS = [
  ['--cngx-color-primary-strong', '--cngx-color-on-primary-strong'],
  ['--cngx-color-danger-strong', '--cngx-color-on-danger-strong'],
] as const;

describe('strong fill pairs in the Material system bridge', () => {
  it.each([
    ['M3', 'mat.define-theme()'],
    [
      'M2',
      'mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))))',
    ],
  ])('maps every fill together with its ink under %s', (_, theme) => {
    const css = compile(theme);
    for (const [fill, ink] of PAIRS) {
      expect(css).toMatch(new RegExp(`${fill}\\s*:`));
      expect(css).toMatch(new RegExp(`${ink}\\s*:`));
    }
  });
});
