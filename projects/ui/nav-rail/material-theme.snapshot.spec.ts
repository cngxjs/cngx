import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/nav-rail-theme.scss`. Pins the resolved
 * `--cngx-*` declarations of `theme($theme)` (rail surface, stacked label
 * size, group flyout, plus the rows, header and footer through the nav-link
 * bridge) for M3 light and dark and for M2, and the `surface($theme)` subset
 * the aggregate theme includes.
 *
 * Co-located with CngxNavRail because `projects/themes/material/` is not
 * wired into `npm run test`, like the breadcrumb, tabs and stepper bridges.
 */

interface CompileOptions {
  themeVersion: 'v1' | 'v0';
  variant: 'light' | 'dark';
  mixin: 'theme' | 'surface';
}

function buildEntry(opts: CompileOptions): string {
  const include = `@include nav-rail.${opts.mixin}($theme);`;
  if (opts.themeVersion === 'v1') {
    return `
@use '@angular/material' as mat;
@use 'material/nav-rail-theme' as nav-rail;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

${include}
`;
  }
  return `
@use '@angular/material' as mat;
@use 'material/nav-rail-theme' as nav-rail;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$warn: mat.m2-define-palette(mat.$m2-red-palette);

$theme: mat.m2-define-light-theme((
  color: (
    primary: $primary,
    accent: $accent,
    warn: $warn,
  ),
));

${include}
`;
}

/** Every `--cngx-*` declaration the bridge emits, keyed by token, whitespace collapsed. */
function parseCustomPropertyDeclarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(--cngx-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    out[match[1]] = match[2].trim().replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function compileAndExtract(opts: CompileOptions): Record<string, string> {
  return parseCustomPropertyDeclarations(compileThemeEntry(buildEntry(opts)));
}

describe('Material nav-rail-theme bridge baseline', () => {
  it('v1 light: resolved --cngx-* declarations match the baseline', () => {
    expect(
      compileAndExtract({ themeVersion: 'v1', variant: 'light', mixin: 'theme' }),
    ).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(
      compileAndExtract({ themeVersion: 'v1', variant: 'dark', mixin: 'theme' }),
    ).toMatchSnapshot();
  });

  it('v0 light: resolved --cngx-* declarations match the baseline', () => {
    expect(
      compileAndExtract({ themeVersion: 'v0', variant: 'light', mixin: 'theme' }),
    ).toMatchSnapshot();
  });

  it('surface() bridges the rail and the flyout only, the rows stay with sidenav.theme', () => {
    const tokens = Object.keys(
      compileAndExtract({ themeVersion: 'v1', variant: 'light', mixin: 'surface' }),
    );
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) {
      expect(token).toMatch(/^--cngx-nav-(rail|flyout)-/);
    }
  });
});
