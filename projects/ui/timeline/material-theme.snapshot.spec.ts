import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/timeline-theme.scss`. Pins the resolved
 * `--cngx-timeline-*` declarations the `theme($theme)` mixin produces for
 * an M3 theme:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token branch
 *     active (light and dark).
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

interface CompileOptions {
  variant: 'light' | 'dark';
}

function buildEntry(opts: CompileOptions): string {
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

/**
 * Extract every `--cngx-*` custom-property declaration the bridge emits,
 * keyed by token name, whitespace collapsed.
 */
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

describe('Material timeline-theme bridge baseline', () => {
  it('v1 light: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ variant: 'light' })).toMatchSnapshot();
  });

  it('v1 dark: resolved --cngx-* declarations match the baseline', () => {
    expect(compileAndExtract({ variant: 'dark' })).toMatchSnapshot();
  });
});
