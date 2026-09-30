import { resolve } from 'node:path';

import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

/**
 * Token-name contract for the field Material bridge
 * (`projects/themes/material/field-theme.scss`). The bridge's historic
 * defect was name drift - 12 of 18 written tokens had zero consumers -
 * so this spec pins the emitted token-name set against the names the
 * forms lib actually reads (label/hint/error/required colors, char-count
 * typography, and the sibling-scoped form-errors pair). Co-located with
 * the consumer because `projects/themes/material/` has no test target.
 */

const REPO_ROOT = resolve(__dirname, '../../..');
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

function compiledCss(themeVersion: 'v1' | 'v0'): string {
  const entry =
    themeVersion === 'v1'
      ? `
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`
      : `
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;
  return compileString(entry, { loadPaths: LOAD_PATHS }).css;
}

function emittedTokenNames(themeVersion: 'v1' | 'v0'): string[] {
  const css = compiledCss(themeVersion);
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}

describe('field Material bridge', () => {
  // every name is consumed by the forms field/input/form-errors CSS
  const CONSUMED = [
    '--cngx-field-affix-color',
    '--cngx-field-char-count-font-size',
    '--cngx-field-error-color',
    '--cngx-field-fill-bg',
    '--cngx-field-fill-bg-hover',
    '--cngx-field-hint-color',
    '--cngx-field-label-color',
    '--cngx-field-required-color',
    '--cngx-field-underline-color',
    '--cngx-field-underline-focus-color',
    '--cngx-form-errors-color',
    '--cngx-form-errors-font-size',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames('v1')).toEqual(CONSUMED);
  });

  it('reaches a skinned control that sits outside any cngx-form-field (M3)', () => {
    const css = compiledCss('v1');
    expect(css).toContain(':where(input[data-skin]');
    expect(css).toContain('--cngx-field-underline-focus-color');
  });

  it('reaches every select-family trigger, which carries the attribute on its host (M3)', () => {
    const css = compiledCss('v1');
    for (const host of [
      'cngx-select',
      'cngx-multi-select',
      'cngx-combobox',
      'cngx-typeahead',
      'cngx-tree-select',
      'cngx-action-select',
      'cngx-action-multi-select',
      'cngx-reorderable-multi-select',
      'cngx-select-shell',
    ]) {
      expect(css).toContain(`${host}[data-skin]`);
    }
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames('v0');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });

  // The box class is the stable hook; the affix-row class only survives as a
  // deprecated alias and must not be what the bridge depends on.
  it('keys the skin tokens on the field box class', () => {
    const css = compiledCss('v1');
    expect(css).toContain('.cngx-field-box[data-skin]');
    expect(css).not.toContain('.cngx-field-affix-row');
  });
});

// The M2 warn 500 is a fill colour: red sits at 3.7:1 on white and 2.7:1 on
// the dark card. The bridge derives the error colour so the error text clears
// 4.5:1 and the error line (same token) 3:1 on the page and on the fill
// surface, for every warn palette in either scheme.
describe('field Material bridge M2 error contrast', () => {
  function m2(scheme: 'light' | 'dark', warn: string): Record<string, string> {
    const css = compileString(
      `
@use 'sass:color';
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

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
      error: pick(/cngx-form-field\)\s*\{[^}]*--cngx-field-error-color: (#[0-9a-f]{6})/),
      formErrorsScope: pick(/cngx-form-errors\)\s*\{[^}]*--cngx-field-error-color: (#[0-9a-f]{6})/),
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

  for (const scheme of ['light', 'dark'] as const) {
    for (const warn of ['red', 'deep-orange', 'pink', 'orange']) {
      it(`${scheme} ${warn}: error text 4.5:1 and error line 3:1 on page and fill`, () => {
        const t = m2(scheme, warn);
        for (const surface of [t['page'], t['card']]) {
          // one token paints text and line, so the text floor covers the line's 3:1
          expect(contrast(t['error'], surface)).toBeGreaterThanOrEqual(4.5);
        }
        expect(t['formErrorsScope']).toBe(t['error']);
      });
    }
  }

  it('keeps the default red recognisably red (hue shift only toward the text colour)', () => {
    const t = m2('light', 'red');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(t['error'].slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g * 2);
    expect(r).toBeGreaterThan(b * 2);
    expect(t['error']).not.toBe(t['warn']);
  });

  it('leaves a warn that already clears 4.5:1 untouched', () => {
    const t = m2('dark', 'orange');
    expect(t['error']).toBe(t['warn']);
  });
});

// The field skins read the two derived core rungs (focus underline, bare
// error text); without a bridge mapping they would keep the Ember / cngx red
// under a Material theme.
describe('system Material bridge', () => {
  function systemCss(themeVersion: 'v1' | 'v0'): string {
    const theme =
      themeVersion === 'v1'
        ? `$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));`
        : `$theme: mat.m2-define-light-theme((color: (
            primary: mat.m2-define-palette(mat.$m2-indigo-palette),
            accent: mat.m2-define-palette(mat.$m2-pink-palette),
          )));`;
    return compileString(
      `
@use '@angular/material' as mat;
@use 'material/system-bridge' as bridge;
${theme}
html { @include bridge.theme($theme); }
`,
      { loadPaths: LOAD_PATHS },
    ).css;
  }

  it('maps the strong primary and danger text rungs (M3)', () => {
    const css = systemCss('v1');
    expect(css).toContain('--cngx-color-primary-strong: var(--mat-sys-primary)');
    expect(css).toContain('--cngx-color-danger-text: var(--mat-sys-error)');
  });

  it('maps the strong primary and danger text rungs (M2)', () => {
    const css = systemCss('v0');
    expect(css).toMatch(/--cngx-color-primary-strong: #[0-9a-f]{3,6}/);
    expect(css).toMatch(/--cngx-color-danger-text: #[0-9a-f]{3,6}/);
  });
});
