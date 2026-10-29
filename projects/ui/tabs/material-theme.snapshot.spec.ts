import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/tabs-theme.scss`. Pins the resolved
 * `--cngx-*` declarations the `theme($theme)` mixin produces across both
 * theme versions:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token
 *     branch active (light and dark).
 *   - v0 (M2): `mat.m2-define-light-theme(...)` with the
 *     `get-theme-color($theme, ...)` branch active.
 *
 * The bridge routes the active indicator / focus / surfaces through the
 * cngx foundation knobs (`--cngx-color-*`), themes the leaf tab tokens
 * directly, and wires the overflow "More" popover onto a Material menu.
 * Any change to a pinned line is intentional only when the diff matches a
 * deliberate bridge edit.
 *
 * Co-located with the CngxTabGroup organism (rather than a dedicated
 * themes test project) because `projects/themes/material/` carries no
 * `ng-package.json` and is not wired into `npm run test`; this keeps the
 * consumer-side regression net next to the symbols it protects. Mirrors
 * `material-theme.snapshot.spec.ts` next to the stepper.
 */

interface CompileOptions {
  themeVersion: 'v1' | 'v0';
  variant: 'light' | 'dark';
}

function buildEntry(opts: CompileOptions): string {
  if (opts.themeVersion === 'v1') {
    return `
@use '@angular/material' as mat;
@use 'material/tabs-theme' as tabs;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

@include tabs.theme($theme);
`;
  }
  return `
@use '@angular/material' as mat;
@use 'material/tabs-theme' as tabs;

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

@include tabs.theme($theme);
`;
}

/**
 * Extract every `--cngx-*` custom-property declaration the bridge emits,
 * keyed by token name, collapsed whitespace. Non-custom-property
 * declarations (the overflow panel's `background` / `box-shadow` etc.) are
 * intentionally out of scope here - the token surface is what consumers
 * theme against.
 */
function parseCustomPropertyDeclarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(--cngx-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    // Collapse runs AND paren-adjacent whitespace: a source-side line
    // break inside color-mix(...) is formatting, not a value change.
    out[match[1]] = match[2].trim().replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function compileAndExtract(opts: CompileOptions): Record<string, string> {
  return parseCustomPropertyDeclarations(compileThemeEntry(buildEntry(opts)));
}

describe('Material tabs-theme bridge baseline', () => {
  it('v1 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'light' })).toMatchSnapshot();
  });

  it('sets the icon and label colours, none of the removed disc and wash tokens', () => {
    const declarations = compileAndExtract({ themeVersion: 'v1', variant: 'light' });
    for (const token of [
      '--cngx-tab-error-badge-color',
      '--cngx-tab-rejection-icon-color',
      '--cngx-tab-failed-text-color',
      '--cngx-tab-refused-color',
      '--cngx-tab-refused-text-color',
      '--cngx-mat-tab-refused-text-color',
    ]) {
      expect(declarations[token]).toBeDefined();
    }
    for (const token of [
      '--cngx-tab-badge-font-size',
      '--cngx-tab-badge-font-weight',
      '--cngx-tab-error-badge-text-color',
      '--cngx-tab-rejection-icon-text',
      '--cngx-tab-rejected-bg',
      '--cngx-mat-tab-has-errors-glyph-color',
    ]) {
      expect(declarations[token]).toBeUndefined();
    }
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'dark' })).toMatchSnapshot();
  });

  it('v0 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v0', variant: 'light' })).toMatchSnapshot();
  });

  it('typography() stays a published forwarding surface for the rejection-icon font-size', () => {
    // theme() places the token via _rejection-icon-typography; the public
    // mixin trio (color/typography/density) must survive for consumers
    // who include the mixins individually under their own selector.
    const css = compileThemeEntry(
      `
@use '@angular/material' as mat;
@use 'material/tabs-theme' as tabs;

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

.probe {
  @include tabs.typography($theme);
}
`,
    );
    expect(css).toContain('--cngx-tab-rejection-icon-font-size:');
  });
});
