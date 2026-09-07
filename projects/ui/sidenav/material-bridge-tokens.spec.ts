import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the nav-link Material bridge
 * (`projects/themes/material/nav-link-theme.scss`), consumed by the
 * sidenav nav links. Pins the emitted token-name set against the names
 * the sidenav/nav-link CSS actually reads - the bridge's historic dead
 * token was `--cngx-nav-link-active-indicator`. Placement correctness
 * (inherits:false registrations vs the sidenav-theme nesting) is the
 * rendered-value harness's job; this file guards the name surface only.
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
  // theme() emits bare declarations (sidenav-theme provides the selector)
  const entry = `
@use '@angular/material' as mat;
@use 'material/nav-link-theme' as bridge;

${theme}

.probe {
  @include bridge.theme($theme);
}
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('nav-link Material bridge', () => {
  // every name is consumed by the sidenav nav-link CSS
  const CONSUMED = [
    '--cngx-nav-link-active-bg',
    '--cngx-nav-link-active-color',
    '--cngx-nav-link-active-font-weight',
    '--cngx-nav-link-color',
    '--cngx-nav-link-font-size',
    '--cngx-nav-link-hover-bg',
    '--cngx-nav-link-hover-color',
    '--cngx-nav-link-padding',
    '--cngx-nav-link-radius',
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
