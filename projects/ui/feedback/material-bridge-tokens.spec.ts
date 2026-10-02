import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the feedback Material bridge
 * (`projects/themes/material/feedback-theme.scss`), consumed by the
 * loading / progress / alert / toast / alert-stack / banner surfaces in
 * `@cngx/ui/feedback`. The bridge's historic dead names were the
 * `--cngx-{alert,toast}-dismiss-*` families (CngxCloseButton shipped
 * its own tokens) plus `--cngx-toast-count-gap` and
 * `--cngx-banner-action-min-size`; this file pins the emitted name set
 * against the names grep-verified in the component stylesheets. The
 * placement block additionally locks the host + descendants broadcast
 * the inherits:false tokens need; rendered values stay the
 * rendered-value harness's job.
 *
 * Co-located with the consumer (mirrors `material-bridge-tokens.spec.ts`
 * next to the sidenav) because `projects/themes/material/` carries no
 * test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function compiledTheme(themeVersion: 'v1' | 'v0'): string {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/feedback-theme' as feedback;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include feedback.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/feedback-theme' as feedback;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include feedback.theme($theme);
`;
  return compileString(entry, { loadPaths: LOAD_PATHS }).css;
}

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const css = compiledTheme(themeVersion);
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('feedback Material bridge', () => {
  // every name is consumed by the ui/feedback component stylesheets
  const CONSUMED = [
    '--cngx-alert-action-color',
    '--cngx-alert-actions-gap',
    '--cngx-alert-bg',
    '--cngx-alert-border-radius',
    '--cngx-alert-error-bg',
    '--cngx-alert-error-border',
    '--cngx-alert-error-icon',
    '--cngx-alert-gap',
    '--cngx-alert-icon-size',
    '--cngx-alert-info-bg',
    '--cngx-alert-info-border',
    '--cngx-alert-info-icon',
    '--cngx-alert-padding',
    '--cngx-alert-stack-gap',
    '--cngx-alert-stack-message-line-height',
    '--cngx-alert-stack-message-size',
    '--cngx-alert-stack-overflow-border',
    '--cngx-alert-stack-overflow-color',
    '--cngx-alert-stack-overflow-padding',
    '--cngx-alert-stack-overflow-size',
    '--cngx-alert-stack-reserve-height',
    '--cngx-alert-success-bg',
    '--cngx-alert-success-border',
    '--cngx-alert-success-icon',
    '--cngx-alert-title-gap',
    '--cngx-alert-title-weight',
    '--cngx-alert-warning-bg',
    '--cngx-alert-warning-border',
    '--cngx-alert-warning-icon',
    '--cngx-banner-action-color',
    '--cngx-banner-action-font-size',
    '--cngx-banner-action-font-weight',
    '--cngx-banner-action-padding',
    '--cngx-banner-action-radius',
    '--cngx-banner-bg',
    '--cngx-banner-color',
    '--cngx-banner-error-bg',
    '--cngx-banner-error-border',
    '--cngx-banner-error-color',
    '--cngx-banner-error-font-size',
    '--cngx-banner-error-icon',
    '--cngx-banner-font-size',
    '--cngx-banner-gap',
    '--cngx-banner-icon-size',
    '--cngx-banner-info-bg',
    '--cngx-banner-info-border',
    '--cngx-banner-info-icon',
    '--cngx-banner-line-height',
    '--cngx-banner-padding',
    '--cngx-banner-pending-opacity',
    '--cngx-banner-success-bg',
    '--cngx-banner-success-border',
    '--cngx-banner-success-icon',
    '--cngx-banner-warning-bg',
    '--cngx-banner-warning-border',
    '--cngx-banner-warning-icon',
    '--cngx-banner-z-index',
    '--cngx-loading-bar-height',
    '--cngx-loading-bar-radius',
    '--cngx-loading-indicator-color',
    '--cngx-loading-indicator-size',
    '--cngx-loading-indicator-track',
    '--cngx-loading-overlay-backdrop-bg',
    '--cngx-loading-overlay-backdrop-opacity',
    '--cngx-loading-overlay-z-index',
    '--cngx-progress-border-radius',
    '--cngx-progress-circle-label-size',
    '--cngx-progress-circle-size',
    '--cngx-progress-color',
    '--cngx-progress-height',
    '--cngx-progress-label-color',
    '--cngx-progress-label-gap',
    '--cngx-progress-label-size',
    '--cngx-progress-track-color',
    '--cngx-toast-accent-width',
    '--cngx-toast-action-padding',
    '--cngx-toast-action-size',
    '--cngx-toast-action-weight',
    '--cngx-toast-bg',
    '--cngx-toast-border-radius',
    '--cngx-toast-color',
    '--cngx-toast-description-color',
    '--cngx-toast-error-accent',
    '--cngx-toast-font-size',
    '--cngx-toast-gap',
    '--cngx-toast-icon-size',
    '--cngx-toast-info-accent',
    '--cngx-toast-inner-gap',
    '--cngx-toast-line-height',
    '--cngx-toast-max-width',
    '--cngx-toast-outlet-padding',
    '--cngx-toast-padding',
    '--cngx-toast-shadow',
    '--cngx-toast-success-accent',
    '--cngx-toast-title-color',
    '--cngx-toast-warning-accent',
    '--cngx-toast-z-index',
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

  it('pins the alert and banner action to the pure severity accent (M3 only)', () => {
    // The cngx default mixes the accent into the text colour for 4.5:1 on the
    // light tint; the M3 accents already clear it, so the bridge keeps the
    // Material look. The M2 warn 500 misses 4.5:1 on its tint, so M2 keeps
    // the cngx default.
    const m3 = compiledTheme('v1');
    expect(m3).toContain('--cngx-alert-action-color: var(--cngx-alert-icon-color)');
    expect(m3).toContain('--cngx-banner-action-color: var(--cngx-banner-accent)');
    const m2 = compiledTheme('v0');
    expect(m2).not.toContain('--cngx-alert-action-color');
    expect(m2).not.toContain('--cngx-banner-action-color');
  });

  it('leaves the M2 alert and banner success / warning to the derived cngx defaults', () => {
    // M2 has no success / warning role. The base hex palette (#22c55e /
    // #f59e0b at 2.2-2.3:1, plus its pale tints) is gone; the cngx defaults
    // derive those tokens from the core semantic colours.
    const css = compiledTheme('v0');
    expect(css).not.toMatch(/--cngx-(alert|banner)-(success|warning)-/);
    const family = css
      .split('\n')
      .filter((line) => /--cngx-(alert|banner)-/.test(line))
      .join('\n');
    for (const hex of ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#eff6ff', '#fef2f2']) {
      expect(family).not.toContain(hex);
    }
    expect(css).toContain('--cngx-alert-info-bg: color-mix(in srgb, #3f51b5 8%, white)');
    expect(css).toContain('--cngx-banner-error-bg: color-mix(in srgb, #f44336 8%, white)');
  });

  it('lifts the M2 banner inline error to 4.5:1 on the card and the info / error tints', () => {
    const css = compiledTheme('v0');
    const value = /--cngx-banner-error-color: (#[0-9a-f]{6});/.exec(css)?.[1];
    expect(value).toBeDefined();
    expect(value).not.toBe('#f44336');
    const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const lum = (c: number[]): number => {
      const [r, g, b] = c.map((v) => {
        const x = v / 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const tint = (hex: string): number[] =>
      rgb(hex).map((v, i) => Math.round(v * 0.08 + [255, 255, 255][i] * 0.92));
    const ink = lum(rgb(value ?? '#000000'));
    for (const ground of [[255, 255, 255], tint('#f44336'), tint('#3f51b5')]) {
      const g = lum(ground);
      expect((Math.max(ink, g) + 0.05) / (Math.min(ink, g) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('maps the M2 toast success and warning accents to the cngx semantic colours', () => {
    // M2 has no success / warning role; the base hex (#22c55e / #f59e0b)
    // missed 3:1 on the card. The last declaration in the rule wins.
    const css = compiledTheme('v0');
    const last = (name: string): string | undefined =>
      [...css.matchAll(new RegExp(`${name}: ([^;]+);`, 'g'))].map((m) => m[1]).at(-1);
    expect(last('--cngx-toast-success-accent')).toBe('var(--cngx-color-success)');
    expect(last('--cngx-toast-warning-accent')).toBe('var(--cngx-color-warning)');
  });

  it('does not resurrect the dead dismiss families', () => {
    for (const themeVersion of ['v1', 'v0'] as const) {
      for (const name of emittedTokenNames(themeVersion)) {
        expect(name).not.toMatch(/-dismiss-/);
      }
    }
  });
});

describe('feedback Material bridge placement', () => {
  // Each family carries inherits:false tokens read on inner elements
  // (spinner track, progress track/label, alert icon/title, toast rows,
  // banner rows/actions); theme() must broadcast to host + descendants
  // (select-theme precedent) or the bridge values resolve to the
  // initial-value at the read sites.
  const BROADCAST_HOSTS = [
    '.cngx-loading-indicator',
    '.cngx-loading-overlay',
    '.cngx-progress',
    '.cngx-alert',
    '.cngx-toast-outlet',
    '.cngx-alert-stack',
    '.cngx-banner-outlet',
  ];

  it('broadcasts every family block to host + descendants', () => {
    const css = compiledTheme('v1');
    for (const host of BROADCAST_HOSTS) {
      expect(css).toMatch(new RegExp(`:where\\(\\${host}, \\${host} \\*\\)\\s*\\{`));
    }
  });
});
