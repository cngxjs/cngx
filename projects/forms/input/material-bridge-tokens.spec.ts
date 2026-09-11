import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contracts for the Material bridges whose consumers live in
 * `@cngx/forms/input`: rating and phone-input. Pins the exact emitted
 * token-name set against the names grep-verified in the component
 * stylesheets (the bridges' historic defect class is name drift).
 * Rendered-value coverage lives in e2e/material-bridge-rendered.spec.ts;
 * this file guards the name surface only. Mirrors the shape of
 * `projects/common/interactive/material-bridge-tokens.spec.ts`.
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

describe('rating Material bridge', () => {
  // every name is consumed by rating.component.css; size, focus-ring
  // geometry and the space-derived gaps deliberately stay unbridged
  const CONSUMED = [
    '--cngx-rating-color',
    '--cngx-rating-color-active',
    '--cngx-rating-disabled-opacity',
    '--cngx-rating-focus-ring',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('rating-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('rating-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});

describe('phone-input Material bridge', () => {
  // the single tone-specific name; gap (space-derived) and
  // number-min-width (content geometry) are documented no-ops
  const CONSUMED = ['--cngx-phone-input-disabled-opacity'];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('phone-input-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('phone-input-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});
