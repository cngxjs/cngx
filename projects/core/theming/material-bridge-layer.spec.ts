import { describe, expect, it } from 'vitest';

import { compileThemeEntry } from '@cngx/testing/sass';

// The system and density bridges assign foundation tokens on the theme host
// (`html { @include ... }`), the same element the root axis providers reflect
// `data-density` / `data-contrast` onto. The axis rules live in
// `@layer cngx.theme`; an unlayered bridge declaration on the same element
// would beat them, so `provideDensity('compact')` and `provideContrast('more')`
// went dead in a bridged app. Inside `@layer cngx.components` the bridge still
// beats every core token block (`cngx.tokens`, any specificity) and loses to
// the axes. e2e/material-bridge-rendered.spec.ts pins the rendered result.

const THEMES = [
  ['M3', 'mat.define-theme()'],
  [
    'M2',
    'mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))))',
  ],
] as const;

const ENTRIES = [
  ['system-bridge', 'material/system-bridge', 'theme', '--cngx-color-surface'],
  ['density-bridge', 'material/density-bridge', 'density', '--cngx-space-md'],
  ['theme', 'material/theme', 'theme', '--cngx-color-surface'],
] as const;

function compile(module: string, mixin: string, theme: string): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use '${module}' as bridge;

html {
  @include bridge.${mixin}(${theme});
}
`);
}

/** The layer each declaration of `token` in `css` sits in (null when unlayered). */
function declarationLayers(css: string, token: string): (string | null)[] {
  const layers: (string | null)[] = [];
  const stack: (string | null)[] = [];
  let depthLayer: string | null = null;
  const re = /(@layer\s+([\w.-]+)\s*\{)|(\{)|(\})|([\w-]+\s*:[^;{}]*;)/g;
  for (const match of css.matchAll(re)) {
    if (match[1]) {
      stack.push(depthLayer);
      depthLayer = match[2];
    } else if (match[3]) {
      stack.push(depthLayer);
    } else if (match[4]) {
      depthLayer = stack.pop() ?? null;
    } else if (match[5]?.startsWith(`${token}:`) || match[5]?.startsWith(`${token} :`)) {
      layers.push(depthLayer);
    }
  }
  return layers;
}

describe('Material system and density bridge layer', () => {
  for (const [name, module, mixin, token] of ENTRIES) {
    it.each(THEMES)(`${name} emits ${token} inside cngx.components under %s`, (_, theme) => {
      const layers = declarationLayers(compile(module, mixin, theme), token);
      expect(layers.length).toBeGreaterThan(0);
      expect(layers.every((layer) => layer === 'cngx.components')).toBe(true);
    });
  }
});
