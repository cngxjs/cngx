import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the segmented-progress Material bridge
 * (`projects/themes/material/segmented-progress-theme.scss`). Pins the
 * emitted token-name set against the names segmented-progress.css reads, and
 * keeps `--mat-sys-*` inside the bridge: the component CSS falls back to the
 * `--cngx-color-*` foundation only. Co-located with the consumer because
 * `projects/themes/material/` has no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function compileBridge(themeVersion: 'v1' | 'v0'): string {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/segmented-progress-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/segmented-progress-theme' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;
  return compileString(entry, { loadPaths: LOAD_PATHS }).css;
}

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const css = compileBridge(themeVersion);
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('segmented-progress Material bridge', () => {
  // every name is read by segmented-progress.css
  const CONSUMED = [
    '--cngx-segmented-progress-active-color',
    '--cngx-segmented-progress-done-color',
    '--cngx-segmented-progress-error-color',
    '--cngx-segmented-progress-todo-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('v1')).toEqual(CONSUMED);
  });

  it('emits the same names (M2)', () => {
    expect(emittedTokenNames('v0')).toEqual(CONSUMED);
  });

  it('maps todo, done, active and error onto surface-variant, primary and error (M3)', () => {
    const css = compileBridge('v1');
    expect(css).toContain('--cngx-segmented-progress-todo-color: var(--mat-sys-surface-variant)');
    expect(css).toContain('--cngx-segmented-progress-done-color: var(--mat-sys-primary)');
    expect(css).toContain('--cngx-segmented-progress-active-color: var(--mat-sys-primary)');
    expect(css).toContain('--cngx-segmented-progress-error-color: var(--mat-sys-error)');
  });

  it('keeps --mat-sys-* out of the component stylesheet', () => {
    const css = readFileSync(
      resolve(REPO_ROOT, 'projects/common/display/segmented-progress/segmented-progress.css'),
      'utf-8',
    );
    expect(css).not.toContain('--mat-sys-');
  });
});
