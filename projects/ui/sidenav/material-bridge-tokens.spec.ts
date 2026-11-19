import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the nav-link Material bridge
 * (`projects/themes/material/nav-link-theme.scss`), consumed by the
 * sidenav nav links. Pins the emitted token-name set against the names
 * the sidenav/nav-link CSS actually reads - the bridge's historic dead
 * token was `--cngx-nav-link-active-indicator`. The placement block
 * below additionally locks the sidenav-theme selector structure at the
 * CSS-text level (broadcast for the inherits:false header/footer/
 * backdrop tokens, nav-link un-nested onto its host class); rendered
 * values stay the rendered-value harness's job.
 */

function bridgeTokenNames(themeVersion: 'v1' | 'v0'): readonly string[] {
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
  return emittedTokenNames(compileThemeEntry(entry));
}

describe('nav-link Material bridge', () => {
  // every name is consumed by the sidenav nav-link CSS
  const CONSUMED = [
    '--cngx-nav-link-active-bg',
    '--cngx-nav-link-active-color',
    '--cngx-nav-link-active-font-weight',
    '--cngx-nav-link-active-hover-bg',
    '--cngx-nav-link-active-indicator-color',
    '--cngx-nav-link-color',
    '--cngx-nav-link-font-size',
    '--cngx-nav-link-font-weight',
    '--cngx-nav-link-hover-bg',
    '--cngx-nav-link-hover-color',
    '--cngx-nav-link-ink',
    '--cngx-nav-link-letter-spacing',
    '--cngx-nav-link-line-height',
    '--cngx-nav-link-pressed-bg',
    '--cngx-nav-link-radius',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames('v1')).toEqual(CONSUMED);
  });

  it('maps the M3 list item: body-large at one weight, on-surface label, on-surface-variant icon, full pill', () => {
    const css = compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/nav-link-theme' as bridge;
$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
.probe { @include bridge.theme($theme); }
`);
    expect(css).toContain('--cngx-nav-link-font-size: var(--mat-sys-body-large-size');
    expect(css).toContain('--cngx-nav-link-line-height: var(--mat-sys-body-large-line-height');
    expect(css).toContain('--cngx-nav-link-letter-spacing: var(--mat-sys-body-large-tracking');
    expect(css).toContain('--cngx-nav-link-font-weight: var(--mat-sys-body-large-weight,');
    expect(css).toContain('--cngx-nav-link-active-font-weight: var(--mat-sys-body-large-weight,');
    expect(css).toContain('--cngx-nav-link-color: var(--mat-sys-on-surface,');
    expect(css).toContain('--cngx-nav-link-active-color: var(--mat-sys-on-surface,');
    expect(css).toContain('--cngx-nav-link-ink: var(--mat-sys-on-surface-variant,');
    expect(css).toContain('--cngx-nav-link-radius: var(--mat-sys-corner-full');
    expect(css).not.toContain('--cngx-nav-link-radius: 8px');
  });

  it('maps shape and type per axis under M2: 8px corners, 14px, 500 when active', () => {
    const css = compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/nav-link-theme' as bridge;
$theme: mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))));
.shape { @include bridge.shape($theme); }
.type { @include bridge.typography($theme); }
`);
    expect(css).toMatch(/\.shape\s*\{\s*--cngx-nav-link-radius: 8px;\s*\}/);
    expect(css).toContain('--cngx-nav-link-font-size: 0.875rem');
    expect(css).toContain('--cngx-nav-link-active-font-weight: 500');
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = bridgeTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });
});

describe('sidenav Material bridge placement', () => {
  function compiledTheme(): string {
    const entry = `
@use '@angular/material' as mat;
@use 'material/sidenav-theme' as sidenav;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include sidenav.theme($theme);
`;
    return compileThemeEntry(entry);
  }

  it('broadcasts the layout tokens to host + descendants (inherits:false backdrop)', () => {
    const css = compiledTheme();
    const broadcast = css.match(
      /:where\(cngx-sidenav-layout, cngx-sidenav-layout \*, cngx-sidenav\)\s*\{[^}]*\}/,
    );
    expect(broadcast).not.toBeNull();
    expect(broadcast![0]).toContain('--cngx-sidenav-backdrop-bg:');
    expect(broadcast![0]).toContain('--cngx-sidenav-overlay-shadow:');
    expect(broadcast![0]).toContain('--mat-sys-level1');
    // a bare mode="side" rail without a layout gets the surface too
    expect(broadcast![0]).toContain('--cngx-sidenav-bg:');
  });

  it('emits the nav header and footer tokens on the slot hosts (inherits:false bg and type)', () => {
    const css = compiledTheme();
    const slots = css.match(/:where\(\.cngx-nav-header, \.cngx-nav-footer\)\s*\{[^}]*\}/);
    expect(slots).not.toBeNull();
    for (const token of [
      '--cngx-nav-header-bg:',
      '--cngx-nav-footer-bg:',
      '--cngx-nav-header-border-color:',
      '--cngx-nav-footer-border-color:',
      '--cngx-nav-header-font-size:',
      '--cngx-nav-footer-font-size:',
    ]) {
      expect(slots![0]).toContain(token);
    }
    expect(css).not.toMatch(/--cngx-sidenav-(header|footer)-/);
  });

  it('emits the M3 list item metrics on the sidenav host with real specificity, not under :where()', () => {
    const css = compiledTheme();
    const metrics = css.match(/cngx-sidenav\[data-nav-railed\]\s*\{[^}]*\}/);
    expect(metrics).not.toBeNull();
    for (const token of [
      '--cngx-nav-link-inset:',
      '--cngx-nav-link-padding:',
      '--cngx-nav-icon-size:',
      '--cngx-nav-icon-gap:',
    ]) {
      expect(metrics![0]).toContain(token);
    }
    expect(metrics![0]).toContain('var(--cngx-space-');
    // one row gap for the body and the rail's popover-group margin
    expect(metrics![0]).toContain('--cngx-sidenav-row-gap: 0');
    expect(css).not.toMatch(/:where\([^)]*cngx-sidenav\[data-nav-railed\]/);
    const body = css.match(/cngx-sidenav\[data-nav-railed\] \.cngx-sidenav__body\s*\{[^}]*\}/);
    expect(body).not.toBeNull();
    expect(body![0]).not.toMatch(/\bgap:/);
  });

  it('emits no list item metrics for an M2 theme', () => {
    const css = compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/sidenav-theme' as sidenav;
$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $primary)));
@include sidenav.theme($theme);
`);
    expect(css).not.toContain('--cngx-nav-icon-size');
    expect(css).not.toContain('.cngx-sidenav__body');
  });

  it('reads the M2 rail ink from the theme foreground, so a dark theme stays readable', () => {
    const css = compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/sidenav-theme' as sidenav;
$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$theme: mat.m2-define-dark-theme((color: (primary: $primary, accent: $primary)));
@include sidenav.theme($theme);
`);
    expect(css).toContain('--cngx-sidenav-color:');
    expect(css).not.toContain('--cngx-sidenav-color: rgba(0, 0, 0, 0.87)');
    expect(css).not.toContain('--cngx-sidenav-border-color: rgba(0, 0, 0, 0.12)');
    // the row ink inherits the rail ink (currentColor); a fixed M2 row colour
    // would stay dark on the dark surface
    expect(css).not.toMatch(/--cngx-nav-link-(hover-)?color:/);
  });

  it('emits the nav-link tokens on the row hosts (link and group head), not nested under the layout', () => {
    const css = compiledTheme();
    const navLink = css.match(/:where\(\.cngx-nav-link, \[cngxNavGroup\]\)\s*\{[^}]*\}/);
    expect(navLink).not.toBeNull();
    // the inherits:false trio that the former layout nesting killed
    expect(navLink![0]).toContain('--cngx-nav-link-radius:');
    expect(navLink![0]).toContain('--cngx-nav-link-font-size:');
    expect(navLink![0]).toContain('--cngx-nav-link-active-font-weight:');
    // no nav-link token may remain in a layout-scoped block
    const layoutBlocks = css.match(/:where\(cngx-sidenav-layout[^)]*\)\s*\{[^}]*\}/g) ?? [];
    for (const block of layoutBlocks) {
      expect(block).not.toContain('--cngx-nav-link-');
    }
  });
});

describe('nav-link Material bridge M2 dark contrast', () => {
  function m2Dark(primary: string): Record<string, string> {
    const css = compileThemeEntry(`
@use 'sass:color';
@use '@angular/material' as mat;
@use 'material/nav-link-theme' as bridge;

$theme: mat.m2-define-dark-theme((color: (
  primary: mat.m2-define-palette(mat.$m2-${primary}-palette),
  accent: mat.m2-define-palette(mat.$m2-pink-palette),
)));

.row { @include bridge.color($theme); }
.slot { @include bridge.slot-color($theme); }
probe {
  --primary: #{color.ie-hex-str(mat.get-theme-color($theme, primary))};
  --card: #{color.ie-hex-str(mat.get-theme-color($theme, background, card))};
  --divider: #{mat.get-theme-color($theme, foreground, divider)};
}
`);
    const pick = (pattern: RegExp): string => {
      const hit = css.match(pattern);
      if (!hit) {
        throw new Error(`no match for ${pattern}`);
      }
      return hit[1];
    };
    const probe = (name: string): string =>
      `#${pick(new RegExp(`--${name}: #FF([0-9A-F]{6})`)).toLowerCase()}`;
    return {
      active: pick(/--cngx-nav-link-active-color: (#[0-9a-f]{6})/),
      indicator: pick(/--cngx-nav-link-active-indicator-color: (#[0-9a-f]{6})/),
      headerBorder: pick(/--cngx-nav-header-border-color: ([^;]+);/),
      footerBorder: pick(/--cngx-nav-footer-border-color: ([^;]+);/),
      divider: pick(/--divider: ([^;]+);/),
      primary: probe('primary'),
      card: probe('card'),
    };
  }

  function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it('lifts the active colour and indicator off the raw primary to 4.5:1 on the card', () => {
    const t = m2Dark('indigo');
    for (const token of [t['active'], t['indicator']]) {
      expect(token).not.toBe(t['primary']);
      expect(contrast(token, t['card'])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('draws the header and footer border in the theme divider', () => {
    const t = m2Dark('indigo');
    expect(t['headerBorder']).toBe(t['divider']);
    expect(t['footerBorder']).toBe(t['divider']);
  });
});
