import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Baseline for the Material bridge in
 * `projects/themes/material/accordion-theme.scss` (base organism + skin
 * presets, one file). Pins the resolved `--cngx-*` declarations the
 * `theme($theme)` mixin produces for an M3 theme:
 *
 *   - v1 (M3): `mat.define-theme(...)` with the `--mat-sys-*` token branch
 *     active (light and dark).
 *
 * Split across two mixins: `theme()` pins the lean base (group/item/header/
 * region tokens + dim-text / subtitle tone) that ships on every accordion, and
 * `skins()` pins the per-skin refinements the full theme.scss aggregation adds -
 * card-surface elevation for the card skins and the per-skin accent fills (bento
 * tile, plus-minus box, severity spine). Any change to a pinned line is
 * intentional only when the diff matches a deliberate bridge edit.
 *
 * Co-located with the CngxAccordionItem organism (rather than a dedicated themes
 * test project) because `projects/themes/material/` carries no `ng-package.json`
 * and is not wired into `npm run test`; this keeps the consumer-side regression
 * net next to the symbols it protects. Mirrors `material-theme.snapshot.spec.ts`
 * next to the breadcrumb, the tabs, and the stepper.
 */

interface CompileOptions {
  variant: 'light' | 'dark';
  // `theme` = the lean base bridge (ships on every accordion); `skins` = the
  // per-skin refinements the full theme.scss aggregation adds on top.
  mixin: 'theme' | 'skins';
}

function buildEntry(opts: CompileOptions): string {
  return `
@use '@angular/material' as mat;
@use 'material/accordion-theme' as accordion;

$theme: mat.define-theme((
  color: (
    theme-type: ${opts.variant},
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
));

@include accordion.${opts.mixin}($theme);
`;
}

/**
 * Extract every `--cngx-*` custom-property declaration the bridge emits, keyed
 * by token name, collapsed whitespace.
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
  return parseCustomPropertyDeclarations(compileThemeEntry(buildEntry(opts)));
}

describe('Material accordion-theme bridge baseline', () => {
  describe('theme() - base organism (ships on every accordion)', () => {
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
  });

  // The system bridge maps the foundation muted text (on-surface-variant);
  // a scoped copy here would only drift from it.
  it('leaves the foundation muted text to the system bridge', () => {
    expect(compileAndExtract({ variant: 'light', mixin: 'theme' })).not.toHaveProperty(
      '--cngx-color-text-muted',
    );
  });

  describe('skins() - per-skin refinements (full aggregation only)', () => {
    it('v1 light: resolved --cngx-* declarations match the baseline', () => {
      expect(
        compileAndExtract({ variant: 'light', mixin: 'skins' }),
      ).toMatchSnapshot();
    });
  });
});
