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

  it('state-scopes the checked thumb to on-primary (M3)', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/interactive-controls-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
    const checkedBlock = css.match(
      /:where\(\.cngx-toggle--checked[^{]*\{[^}]*\}/,
    )?.[0];
    expect(checkedBlock).toContain('--cngx-toggle-thumb-bg: var(--mat-sys-on-primary)');
    // the resting broadcast keeps the outline thumb
    expect(css).toContain('--cngx-toggle-thumb-bg: var(--mat-sys-outline)');
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('interactive-controls-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});

describe('copy-block Material bridge', () => {
  // every name is consumed by copy-block.css on the __button element
  const CONSUMED = [
    '--cngx-copy-block-btn-bg',
    '--cngx-copy-block-btn-border',
    '--cngx-copy-block-btn-color',
    '--cngx-copy-block-btn-copied-bg',
    '--cngx-copy-block-btn-copied-border',
    '--cngx-copy-block-btn-copied-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('copy-block-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('copy-block-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});

describe('ripple Material bridge', () => {
  // every name is consumed by cngx-ripple.css on the __wave child
  const CONSUMED = ['--cngx-ripple-color', '--cngx-ripple-duration', '--cngx-ripple-opacity'];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('ripple-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('ripple-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });

  it('layers the bridge and broadcasts to host + descendants', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/ripple-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
    // formerly the only unlayered bridge besides filter-builder - an
    // unlayered rule would beat any layered consumer override
    expect(css).toMatch(/@layer cngx\.components\s*\{/);
    // opacity/duration are inherits:false, read on the __wave child
    expect(css).toMatch(/:where\(\[cngxRipple\], \[cngxRipple\] \*\)\s*\{/);
  });
});

describe('button-toggle Material bridge', () => {
  // The leaf chrome (theming/components/cngx-button-toggle.css) reads no
  // component-level color token - every tone derives from the foundation
  // knobs, so the bridge routes those (tabs-theme precedent). The spacing
  // tokens are deliberately absent: SET from --cngx-space-* at the toggle
  // host, density-bridge territory.
  const CONSUMED = [
    '--cngx-color-border',
    '--cngx-color-on-primary',
    '--cngx-color-primary',
    '--cngx-color-surface',
    '--cngx-color-text',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('button-toggle-theme', 'v1')).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('button-toggle-theme', 'v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });

  it('assigns on the group hosts and the toggle button, layered and zero-specificity', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/button-toggle-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
    expect(css).toMatch(/@layer cngx\.components\s*\{/);
    const block = css.match(
      /:where\(cngx-button-toggle-group, cngx-button-multi-toggle-group, button\[cngxButtonToggle\]\)\s*\{[^}]*\}/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toContain('--cngx-color-primary: var(--mat-sys-primary)');
    // no spacing fork - the padding tokens ride the SET-from-scale rule
    expect(css).not.toContain('--cngx-button-toggle-');
  });
});
