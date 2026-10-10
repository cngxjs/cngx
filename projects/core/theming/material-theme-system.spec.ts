import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

/**
 * Contract for `theme-system($density)` in `projects/themes/material/theme.scss`,
 * the entry point for apps scaffolded by `ng add @angular/material`, which emit
 * the map API `mat.theme((...))` and carry no `$theme` object. The mixin feeds a
 * `mat.define-theme` carrier into the unchanged `theme($theme)`; in M3 the
 * carrier only contributes the version and the density scale, every color
 * reads `var(--mat-sys-*)` from the consumer's `mat.theme`.
 *
 * Lives in core's test target because the asserted system and density tokens
 * are declared by `@cngx/core/theming`, and `projects/themes` has no test target.
 */

const MAP_API_THEME = `mat.theme((
    color: (theme-type: light, primary: mat.$azure-palette),
    typography: Roboto,
    density: -2,
  ))`;

function compileMapApp(): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/theme' as cngx-material;

html {
  @include ${MAP_API_THEME};
  @include cngx-material.theme-system(-2);
}
`);
}

function compileThemeObjectApp(): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/theme' as cngx-material;

html {
  @include cngx-material.theme(mat.define-theme((density: (scale: -2))));
}
`);
}

function cngxDeclarations(css: string): readonly string[] {
  return [...css.matchAll(/(--cngx-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)].map(
    (m) => `${m[1]}: ${m[2].trim().replace(/\s+/g, ' ')}`,
  );
}

describe('theme-system', () => {
  const css = compileMapApp();
  const declarations = cngxDeclarations(css);

  it('maps the system surface onto the map-API --mat-sys-* value', () => {
    expect(declarations).toContain('--cngx-color-surface: var(--mat-sys-surface)');
  });

  it('reaches a var-only component bridge', () => {
    expect(declarations).toContain('--cngx-accordion-header-color: var(--mat-sys-on-surface)');
  });

  it('applies the density scale to the global space tokens', () => {
    expect(declarations).toContain('--cngx-space-sm: 6px');
  });

  it('lets no carrier palette hex reach a --cngx-* color token', () => {
    const hexColors = declarations.filter(
      (d) => d.startsWith('--cngx-color-') && /#[0-9a-f]{3,8}\b/i.test(d),
    );
    expect(hexColors).toEqual([]);
  });
});

describe('theme', () => {
  it('emits the same --cngx-* declarations for a define-theme object of the same density', () => {
    expect(cngxDeclarations(compileThemeObjectApp())).toEqual(cngxDeclarations(compileMapApp()));
  });
});
