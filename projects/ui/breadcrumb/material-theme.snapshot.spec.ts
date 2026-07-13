import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/breadcrumb-theme.scss`. Pins the resolved
 * `--cngx-*` declarations the `theme($theme)` mixin produces across both
 * theme versions:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token
 *     branch active (light and dark).
 *   - v0 (M2): `mat.m2-define-light-theme(...)` with the
 *     `get-theme-color($theme, ...)` branch active.
 *
 * The bridge themes the bar's link / current / separator colours, the density
 * gap, and the overflow + siblings trigger / row-hover knobs. Skin chips (incl.
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

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

interface CompileOptions {
  themeVersion: 'v1' | 'v0';
  variant: 'light' | 'dark';
}

function buildEntry(opts: CompileOptions): string {
  if (opts.themeVersion === 'v1') {
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
  return `
@use '@angular/material' as mat;
@use 'material/breadcrumb-theme' as breadcrumb;

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
    out[match[1]] = match[2].trim().replace(/\s+/g, ' ');
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function compileAndExtract(opts: CompileOptions): Record<string, string> {
  const result = compileString(buildEntry(opts), {
    loadPaths: LOAD_PATHS,
    style: 'expanded',
    quietDeps: true,
  });
  return parseCustomPropertyDeclarations(result.css);
}

describe('Material breadcrumb-theme bridge baseline', () => {
  it('v1 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'light' })).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v1', variant: 'dark' })).toMatchSnapshot();
  });

  it('v0 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ themeVersion: 'v0', variant: 'light' })).toMatchSnapshot();
  });
});
