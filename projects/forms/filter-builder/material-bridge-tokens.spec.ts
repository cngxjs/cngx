import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * M2 contrast contract for the filter-builder Material bridge
 * (`projects/themes/material/filter-builder-theme.scss`). The error foreground
 * paints the remove glyph, which is text: the raw M2 warn 500 misses 4.5:1
 * (red 3.7:1 on white, 2.7:1 on the dark card), so the bridge derives it the
 * same way as the field error colour. Co-located with the consumer because
 * `projects/themes/material/` has no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function m2(scheme: 'light' | 'dark', warn: string): Record<string, string> {
  const css = compileString(
    `
@use 'sass:color';
@use '@angular/material' as mat;
@use 'material/filter-builder-theme' as bridge;

$theme: mat.m2-define-${scheme}-theme((color: (
  primary: mat.m2-define-palette(mat.$m2-indigo-palette),
  accent: mat.m2-define-palette(mat.$m2-pink-palette),
  warn: mat.m2-define-palette(mat.$m2-${warn}-palette),
)));

@include bridge.theme($theme);
probe {
  --warn: #{color.ie-hex-str(mat.get-theme-color($theme, warn))};
  --page: #{color.ie-hex-str(mat.get-theme-color($theme, background, background))};
  --card: #{color.ie-hex-str(mat.get-theme-color($theme, background, card))};
}
`,
    { loadPaths: LOAD_PATHS },
  ).css;
  const pick = (pattern: RegExp): string => {
    const hit = css.match(pattern);
    if (!hit) {
      throw new Error(`no match for ${pattern}`);
    }
    return hit[1];
  };
  const probe = (name: string): string => `#${pick(new RegExp(`--${name}: #FF([0-9A-F]{6})`)).toLowerCase()}`;
  return {
    errorFg: pick(/--cngx-filter-builder-error-fg: (#[0-9a-f]{6})/),
    warn: probe('warn'),
    page: probe('page'),
    card: probe('card'),
  };
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('filter-builder Material bridge M2 error contrast', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const warn of ['red', 'deep-orange', 'pink', 'orange']) {
      it(`${scheme} ${warn}: remove glyph 4.5:1 on page and card`, () => {
        const t = m2(scheme, warn);
        for (const surface of [t['page'], t['card']]) {
          expect(contrast(t['errorFg'], surface)).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it('leaves a warn that already clears 4.5:1 untouched', () => {
    const t = m2('dark', 'orange');
    expect(t['errorFg']).toBe(t['warn']);
  });

  it('keeps the M3 error role as is', () => {
    const css = compileString(
      `
@use '@angular/material' as mat;
@use 'material/filter-builder-theme' as bridge;
$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
@include bridge.theme($theme);
`,
      { loadPaths: LOAD_PATHS },
    ).css;
    expect(css).toContain('--cngx-filter-builder-error-fg: var(--mat-sys-error)');
  });
});
