import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/timeline-theme.scss`. Pins the resolved
 * `--cngx-timeline-*` declarations the `theme($theme)` mixin produces across
 * both theme versions:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token branch
 *     active (light and dark).
 *   - v0 (M2): `mat.m2-define-light-theme(...)` with the M2 color branch.
 *
 * Timeline is the fifth bridge-bearing family; the value snapshot matches the
 * regression net already next to the accordion, breadcrumb, stepper and tabs
 * bridges. Any change to a pinned line is intentional only when the diff
 * matches a deliberate bridge edit.
 *
 * Co-located with the CngxTimeline organism (rather than a dedicated themes
 * test project) because `projects/themes/material/` carries no
 * `ng-package.json` and is not wired into `npm run test`; this keeps the
 * consumer-side regression net next to the symbols it protects.
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
@use 'material/timeline-theme' as timeline;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

@include timeline.theme($theme);
`;
  }
  return `
@use '@angular/material' as mat;
@use 'material/timeline-theme' as timeline;

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

@include timeline.theme($theme);
`;
}

/**
 * Extract every `--cngx-*` custom-property declaration the bridge emits,
 * keyed by token name, whitespace collapsed.
 */
function parseCustomPropertyDeclarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(--cngx-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    out[match[1]] = match[2]
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')');
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

describe('Material timeline-theme bridge baseline', () => {
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
