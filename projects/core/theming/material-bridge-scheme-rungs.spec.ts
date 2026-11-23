import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

// Highlight, success and warning have no Material role. Their core values
// follow the scheme cngx detects (OS or data-color-scheme); a Material theme
// typed light or dark ignores the OS, so the bridge emits the core literals of
// the theme's own scheme. A color-scheme theme follows the OS like core does
// and gets none. The literals are read from system-tokens.css, so a core value
// change without the bridge fails here.

const SCHEME_RUNGS = [
  '--cngx-color-highlight',
  '--cngx-color-success',
  '--cngx-color-warning',
] as const;

const systemTokens = readFileSync(
  resolve(process.cwd(), 'projects/core/theming/system-tokens.css'),
  'utf-8',
);

function blockBetween(start: string, end: string): string {
  const from = systemTokens.indexOf(start);
  const to = systemTokens.indexOf(end, from);
  expect(from, `${start} in system-tokens.css`).toBeGreaterThan(-1);
  expect(to, `${end} in system-tokens.css`).toBeGreaterThan(from);
  return systemTokens.slice(from, to);
}

function declared(css: string, token: string): string | undefined {
  const match = new RegExp(`${token}:\\s*([^;]+);`).exec(css);
  return match?.[1].trim();
}

const CORE = {
  light: blockBetween('Block 1 - light defaults', 'Block 2 - OS auto-follow'),
  dark: blockBetween('Block 3 - explicit dark', 'Block 4 - explicit light'),
} as const;

function compileBridge(theme: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as bridge;

html {
  @include bridge.theme(${theme});
}
`);
}

const THEMES = [
  {
    name: 'M3 light',
    theme: 'mat.define-theme((color: (theme-type: light)))',
    scheme: 'light',
    muted: 'var(--mat-sys-on-surface-variant)',
  },
  {
    name: 'M3 dark',
    theme: 'mat.define-theme((color: (theme-type: dark)))',
    scheme: 'dark',
    muted: 'var(--mat-sys-on-surface-variant)',
  },
  {
    name: 'M3 color-scheme',
    theme: 'mat.define-theme((color: (theme-type: color-scheme)))',
    scheme: null,
    muted: 'var(--mat-sys-on-surface-variant)',
  },
] as const;

describe('Material system bridge: muted text and the scheme-bound rungs', () => {
  it.each(THEMES)('$name maps muted text onto the Material role', ({ theme, muted }) => {
    expect(declared(compileBridge(theme), '--cngx-color-text-muted')).toBe(muted);
  });

  it.each(THEMES.filter((t) => t.scheme !== null))(
    '$name emits the core $scheme literals for highlight, success and warning',
    ({ theme, scheme }) => {
      const css = compileBridge(theme);
      for (const token of SCHEME_RUNGS) {
        const core = declared(CORE[scheme as 'light' | 'dark'], token);
        expect(core, `${token} in core ${scheme}`).toBeDefined();
        expect(declared(css, token), token).toBe(core);
      }
    },
  );

  it('a color-scheme theme declares none of them, so the core values stay', () => {
    const css = compileBridge('mat.define-theme((color: (theme-type: color-scheme)))');
    for (const token of SCHEME_RUNGS) {
      expect(declared(css, token), token).toBeUndefined();
    }
  });
});
