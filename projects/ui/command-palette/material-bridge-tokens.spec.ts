import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the command-palette Material bridge
 * (`projects/themes/material/command-palette-theme.scss`). Pins the exact
 * emitted token-name set and scans the two consumer stylesheets (palette
 * dialog + panel body) so every emitted name provably has a read site -
 * the bridges' historic defect class is name drift. The 46-name consumed
 * universe is deliberately larger than the emitted set: spacing rides
 * density-bridge, geometry and the already-M3-shaped radii keep their cngx
 * defaults (documented in the bridge header). Rendered-value coverage,
 * including the dialog-subtree and ::backdrop placement proof, lives in
 * e2e/material-bridge-rendered.spec.ts.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

const CONSUMER_STYLESHEETS = [
  'projects/ui/command-palette/palette/command-palette.component.css',
  'projects/ui/command-palette/panel/command-panel.component.css',
];

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
@use 'material/command-palette-theme' as bridge;

${theme}

@include bridge.theme($theme);
`;
  const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

function consumedTokenNames(): Set<string> {
  const names = new Set<string>();
  for (const stylesheet of CONSUMER_STYLESHEETS) {
    const css = readFileSync(resolve(REPO_ROOT, stylesheet), 'utf8');
    for (const match of css.matchAll(/--cngx-command-[a-z0-9-]+/g)) {
      names.add(match[0]);
    }
  }
  return names;
}

describe('command-palette Material bridge', () => {
  const CONSUMED = [
    '--cngx-command-backdrop',
    '--cngx-command-bg',
    '--cngx-command-border',
    '--cngx-command-chip-bg',
    '--cngx-command-chip-color',
    '--cngx-command-color',
    '--cngx-command-error-color',
    '--cngx-command-focus-outline',
    '--cngx-command-footer-color',
    '--cngx-command-footer-size',
    '--cngx-command-header-color',
    '--cngx-command-header-size',
    '--cngx-command-header-weight',
    '--cngx-command-input-color',
    '--cngx-command-kbd-bg',
    '--cngx-command-kbd-color',
    '--cngx-command-mark-bg',
    '--cngx-command-placeholder-color',
    '--cngx-command-radius',
    '--cngx-command-row-active-bg',
    '--cngx-command-row-active-color',
    '--cngx-command-row-color',
    '--cngx-command-row-disabled-opacity',
    '--cngx-command-shadow',
    '--cngx-command-state-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('v1')).toEqual(CONSUMED);
  });

  it('every emitted name has a read site in the two consumer stylesheets (M3)', () => {
    const consumed = consumedTokenNames();
    for (const name of emittedTokenNames('v1')) {
      expect(consumed).toContain(name);
    }
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });

  it('assigns on the palette and panel hosts, layered and zero-specificity', () => {
    const entry = `
@use '@angular/material' as mat;
@use 'material/command-palette-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;
    const css = compileString(entry, { loadPaths: LOAD_PATHS }).css;
    expect(css).toMatch(/@layer cngx\.components\s*\{/);
    const block = css.match(/:where\(cngx-command-palette, cngx-command-panel\)\s*\{[^}]*\}/);
    expect(block).not.toBeNull();
    expect(block![0]).toContain('--cngx-command-bg: var(--mat-sys-surface-container-high)');
    expect(block![0]).toContain('--cngx-command-row-active-bg: var(--mat-sys-secondary-container)');
  });
});
