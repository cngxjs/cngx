import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

// The strong fill pairs travel as a unit: a bridge that maps the fill without
// its ink leaves Material fills under the cngx default ink for every reader
// outside the button host (select chips, the dragged chip).

function compile(theme: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;

html {
  @include cngx-system.theme(${theme});
}
`);
}

const PAIRS = [
  ['--cngx-color-primary-strong', '--cngx-color-on-primary-strong'],
  ['--cngx-color-danger-strong', '--cngx-color-on-danger-strong'],
] as const;

describe('strong fill pairs in the Material system bridge', () => {
  it.each([
    ['M3', 'mat.define-theme()'],
    [
      'M2',
      'mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))))',
    ],
  ])('maps every fill together with its ink under %s', (_, theme) => {
    const css = compile(theme);
    for (const [fill, ink] of PAIRS) {
      expect(css).toMatch(new RegExp(`${fill}\\s*:`));
      expect(css).toMatch(new RegExp(`${ink}\\s*:`));
    }
  });
});

// Component bridges that route a strong pair themselves, so the fill and its
// ink hold where the system bridge is absent. Each must emit the pair on the
// host block the fill sits under, and never the undefined plain on-* ink.

const M3 = 'mat.define-theme()';
const M2 =
  'mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))))';

function compileComponentBridge(bridge: string, mixin: string, theme: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/${bridge}' as b;

$theme: ${theme};
@include b.${mixin}($theme);
`);
}

/** Declarations of the innermost rule blocks whose selector contains `host`. */
function declarationsUnder(css: string, host: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selector.includes(host)) {
      continue;
    }
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) {
      found.set(name, value.trim());
    }
  }
  return found;
}

const COMPONENT_BRIDGES = [
  {
    name: 'stepper',
    bridge: 'stepper-theme',
    mixin: 'theme',
    hosts: ['cngx-stepper', 'cngx-dot-stepper'],
    fill: '--cngx-color-danger-strong',
    ink: '--cngx-color-on-danger-strong',
    m3: ['var(--mat-sys-error)', 'var(--mat-sys-on-error)'],
  },
  {
    name: 'paginator',
    bridge: 'paginator-theme',
    mixin: 'theme',
    hosts: ['cngx-paginator'],
    fill: '--cngx-color-primary-strong',
    ink: '--cngx-color-on-primary-strong',
    m3: ['var(--mat-sys-primary)', 'var(--mat-sys-on-primary)'],
  },
  {
    name: 'data-grid-accordion spreadsheet skin',
    bridge: 'data-grid-accordion-theme',
    mixin: 'skins',
    hosts: ['spreadsheet'],
    fill: '--cngx-color-primary-strong',
    ink: '--cngx-color-on-primary-strong',
    m3: ['var(--mat-sys-primary)', 'var(--mat-sys-on-primary)'],
  },
] as const;

describe('strong fill pairs in the component bridges', () => {
  describe.each(COMPONENT_BRIDGES)('$name', ({ bridge, mixin, hosts, fill, ink, m3 }) => {
    it.each(hosts)('routes the M3 pair on %s', (host) => {
      const decls = declarationsUnder(compileComponentBridge(bridge, mixin, M3), host);
      expect(decls.get(fill)).toBe(m3[0]);
      expect(decls.get(ink)).toBe(m3[1]);
    });

    it.each(hosts)('routes an M2 fill with its own contrast ink on %s', (host) => {
      const decls = declarationsUnder(compileComponentBridge(bridge, mixin, M2), host);
      const fillValue = decls.get(fill);
      const inkValue = decls.get(ink);
      expect(fillValue).toBeTruthy();
      expect(inkValue).toBeTruthy();
      expect(inkValue).not.toBe(fillValue);
    });

    it.each([M3, M2])('emits no plain on-primary / on-danger ink (%#)', (theme) => {
      const css = compileComponentBridge(bridge, mixin, theme);
      expect(css).not.toMatch(/--cngx-color-on-(primary|danger)\s*:/);
    });
  });
});
