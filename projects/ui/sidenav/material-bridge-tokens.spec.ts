import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

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
    return compileString(entry, { loadPaths: LOAD_PATHS, style: 'expanded' }).css;
  }

  it('broadcasts the layout tokens to host + descendants (inherits:false header/footer/backdrop)', () => {
    const css = compiledTheme();
    const broadcast = css.match(
      /:where\(cngx-sidenav-layout, cngx-sidenav-layout \*\)\s*\{[^}]*\}/,
    );
    expect(broadcast).not.toBeNull();
    expect(broadcast![0]).toContain('--cngx-sidenav-header-bg:');
    expect(broadcast![0]).toContain('--cngx-sidenav-footer-bg:');
    expect(broadcast![0]).toContain('--cngx-sidenav-backdrop-bg:');
  });

  it('emits the nav-link tokens on the .cngx-nav-link host class, not nested under the layout', () => {
    const css = compiledTheme();
    const navLink = css.match(/:where\(\.cngx-nav-link\)\s*\{[^}]*\}/);
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
