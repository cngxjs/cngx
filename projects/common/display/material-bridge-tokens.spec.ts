import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the segmented-progress Material bridge
 * (`projects/themes/material/segmented-progress-theme.scss`). Pins the
 * emitted token-name set against the names segmented-progress.css reads, and
 * keeps `--mat-sys-*` inside the bridge: the component CSS falls back to the
 * `--cngx-color-*` foundation only. Co-located with the consumer because
 * `projects/themes/material/` has no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');

function compileBridge(): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/segmented-progress-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
}

function bridgeTokenNames(): readonly string[] {
  return emittedTokenNames(compileBridge());
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
    expect(bridgeTokenNames()).toEqual(CONSUMED);
  });

  it('maps todo, done, active and error onto surface-variant, primary and error (M3)', () => {
    const css = compileBridge();
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

/**
 * Token-name contract for the badge Material bridge
 * (`projects/themes/material/badge-theme.scss`). The indicator writes its line
 * height and corner translate as literals (cngx-badge.css), so the bridge
 * writes those properties in raw rules; the token names stay the ones the
 * badge reads.
 */
describe('badge Material bridge', () => {
  function compileBadgeBridge(): string {
    return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/badge-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
  }

  // every name is read by cngx-badge.css
  const CONSUMED = [
    '--cngx-badge-error-bg',
    '--cngx-badge-error-color',
    '--cngx-badge-font-size',
    '--cngx-badge-font-weight',
    '--cngx-badge-neutral-bg',
    '--cngx-badge-neutral-color',
    '--cngx-badge-primary-bg',
    '--cngx-badge-primary-color',
    '--cngx-badge-radius',
    '--cngx-badge-warning-bg',
    '--cngx-badge-warning-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames(compileBadgeBridge())).toEqual(CONSUMED);
  });

  it('takes the label-small weight and line height and the mat-badge overhang (M3)', () => {
    const css = compileBadgeBridge();
    expect(css).toContain('--cngx-badge-font-weight: var(--mat-sys-label-small-weight, 500)');
    expect(css).toContain('line-height: var(--mat-sys-label-small-line-height, 16px)');
    expect(css).toMatch(
      /\.cngx-badge-host > \.cngx-badge-indicator\.cngx-badge-indicator--above-end \{\s*transform: none;\s*top: calc\(-1 \* var\(--cngx-space-xs, 4px\)\);\s*inset-inline-end: calc\(-1 \* var\(--cngx-space-xs, 4px\)\);/,
    );
  });
});

/**
 * Token-name contract for the chip Material bridge
 * (`projects/themes/material/chip-theme.scss`). The chip SETs its padding and
 * gap tokens inside `@scope`, so the bridge assigns them in a raw rule on the
 * density rungs instead of a literal px map.
 */
describe('chip Material bridge', () => {
  function compileChipBridge(): string {
    return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/chip-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
  }

  // every name is read by chip.component.css
  const CONSUMED = [
    '--cngx-chip-bg',
    '--cngx-chip-border',
    '--cngx-chip-color',
    '--cngx-chip-danger-bg',
    '--cngx-chip-danger-color',
    '--cngx-chip-focus-outline',
    '--cngx-chip-font-size',
    '--cngx-chip-hover-bg',
    '--cngx-chip-hover-color',
    '--cngx-chip-info-bg',
    '--cngx-chip-info-color',
    '--cngx-chip-inner-gap',
    '--cngx-chip-padding-block',
    '--cngx-chip-padding-inline',
    '--cngx-chip-radius',
    '--cngx-chip-remove-focus-color',
    '--cngx-chip-selected-bg',
    '--cngx-chip-selected-color',
    '--cngx-chip-success-bg',
    '--cngx-chip-success-color',
    '--cngx-chip-warning-bg',
    '--cngx-chip-warning-color',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames(compileChipBridge())).toEqual(CONSUMED);
  });

  it('rests transparent with an outline edge and an on-surface-variant label (M3)', () => {
    const css = compileChipBridge();
    expect(css).toContain('--cngx-chip-bg: transparent');
    expect(css).toContain('--cngx-chip-border: 1px solid var(--mat-sys-outline)');
    expect(css).toContain('--cngx-chip-color: var(--mat-sys-on-surface-variant)');
  });

  it('derives the metrics from the density rungs, not px maps (M3)', () => {
    const css = compileChipBridge();
    expect(css).toContain('--cngx-chip-padding-block: calc(var(--cngx-space-xs, 4px) * 1.5 - 1px)');
    expect(css).toContain('--cngx-chip-padding-inline: calc(var(--cngx-space-sm, 8px) * 1.5 - 1px)');
    expect(css).toContain('line-height: var(--mat-sys-label-large-line-height, 1.25rem)');
    expect(css).not.toMatch(/--cngx-chip-padding-(block|inline): \d+px/);
  });
});
