import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/nav-rail-theme.scss`. Pins the resolved
 * `--cngx-*` declarations of `theme($theme)` (rail surface, stacked label
 * size, group flyout, plus the rows, header and footer through the nav-link
 * bridge) for M3 light and dark, and the `surface($theme)` subset
 * the aggregate theme includes.
 *
 * Co-located with CngxNavRail because `projects/themes/material/` is not
 * wired into `npm run test`, like the breadcrumb, tabs and stepper bridges.
 */

interface CompileOptions {
  variant: 'light' | 'dark';
  mixin: 'theme' | 'surface';
}

function buildEntry(opts: CompileOptions): string {
  const include = `@include nav-rail.${opts.mixin}($theme);`;
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
      compileAndExtract({ variant: 'light', mixin: 'theme' }),
    ).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(
      compileAndExtract({ variant: 'dark', mixin: 'theme' }),
    ).toMatchSnapshot();
  });

  it('surface() bridges the rail, the flyout and the rail metrics, the row colours stay with sidenav.theme', () => {
    const tokens = Object.keys(
      compileAndExtract({ variant: 'light', mixin: 'surface' }),
    );
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) {
      expect(token).toMatch(
        /^--cngx-nav-(rail|flyout)-|^--cngx-nav-icon-(size|gap)$|^--cngx-nav-link-(inset|padding|line-height|letter-spacing|font-weight|active-font-weight)$/,
      );
    }
  });

  it('paints the labelled look indicator as a pill behind the icon, outside forced colours', () => {
    const css = compileThemeEntry(
      buildEntry({ variant: 'light', mixin: 'surface' }),
    );
    expect(css).toMatch(/@media \(forced-colors: none\)/);
    expect(css).toContain(
      'cngx-nav-rail.cngx-nav-rail[data-label-placement=below] :is(.cngx-nav-link, .cngx-nav-group):not(.cngx-nav-group-content *).cngx-nav-link--active::after',
    );
  });
});
