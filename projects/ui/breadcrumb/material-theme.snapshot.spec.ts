import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/breadcrumb-theme.scss`. Pins the resolved
 * `--cngx-*` declarations the `theme($theme)` mixin produces for an M3
 * theme:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token
 *     branch active (light and dark).
 *
 * The bridge themes the bar's link / current / separator colours and the
 * overflow + siblings trigger / row-hover knobs. The gap now derives from the
 * global spacing scale (breadcrumb.css), so it is no longer bridged here. Skin chips (incl.
 * contained) self-assign from --cngx-color-* in their own :scope, so they are
 * not bridged here.
 * Any change to a pinned line is intentional only when the diff matches a
 * deliberate bridge edit.
 *
 * Co-located with the CngxBreadcrumbBar organism (rather than a dedicated
 * themes test project) because `projects/themes/material/` carries no
 * `ng-package.json` and is not wired into `npm run test`; this keeps the
 * consumer-side regression net next to the symbols it protects. Mirrors
 * `material-theme.snapshot.spec.ts` next to the tabs and the stepper.
 */

interface CompileOptions {
  variant: 'light' | 'dark';
}

function buildEntry(opts: CompileOptions): string {
  return `
@use '@angular/material' as mat;
@use 'material/breadcrumb-theme' as breadcrumb;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

@include breadcrumb.theme($theme);
`;
}

/**
 * Extract every `--cngx-*` custom-property declaration the bridge emits,
 * keyed by token name, collapsed whitespace.
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

describe('Material breadcrumb-theme bridge baseline', () => {
  it('v1 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ variant: 'light' })).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ variant: 'dark' })).toMatchSnapshot();
  });
});
