import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the field Material bridge
 * (`projects/themes/material/field-theme.scss`). The bridge's historic
 * defect was name drift - 12 of 18 written tokens had zero consumers -
 * so this spec pins the emitted token-name set against the names the
 * forms lib actually reads (label/hint/error/required colors, char-count
 * typography, and the sibling-scoped form-errors pair). Co-located with
 * the consumer because `projects/themes/material/` has no test target.
 */

function compiledCss(): string {
  return compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/field-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`);
}

function bridgeTokenNames(): readonly string[] {
  return emittedTokenNames(compiledCss());
}

describe('field Material bridge', () => {
  // every name is consumed by the forms field/input/form-errors CSS
  const CONSUMED = [
    '--cngx-field-affix-color',
    '--cngx-field-affix-icon-size',
    '--cngx-field-affix-target',
    '--cngx-field-char-count-color',
    '--cngx-field-char-count-font-size',
    '--cngx-field-char-count-over-color',
    '--cngx-field-error-color',
    '--cngx-field-fill-bg',
    '--cngx-field-fill-bg-hover',
    '--cngx-field-hint-color',
    '--cngx-field-hint-font-size',
    '--cngx-field-label-color',
    '--cngx-field-padding-block',
    '--cngx-field-padding-inline',
    '--cngx-field-placeholder-color',
    '--cngx-field-required-color',
    '--cngx-field-ring-color',
    '--cngx-field-underline-color',
    '--cngx-field-underline-focus-color',
    '--cngx-form-errors-color',
    '--cngx-form-errors-font-size',
  ];

  it('emits only consumed token names (M3)', () => {
    expect(bridgeTokenNames()).toEqual(CONSUMED);
  });

  it('reaches a skinned control that sits outside any cngx-form-field (M3)', () => {
    const css = compiledCss();
    expect(css).toContain(':where(input[data-skin]');
    expect(css).toContain('--cngx-field-underline-focus-color');
  });

  it('reaches every select-family trigger, which carries the attribute on its host (M3)', () => {
    const css = compiledCss();
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

  it('maps the field ring to the primary in the field and skinned-control scopes', () => {
    const v1 = compiledCss();
    expect(v1).toMatch(
      /:where\(input\[data-skin\][^{]*\{[^}]*--cngx-field-ring-color: var\(--mat-sys-primary\)/,
    );
    expect(v1).toMatch(
      /cngx-form-field\)\s*\{[^}]*--cngx-field-ring-color: var\(--mat-sys-primary\)/,
    );
  });

  it('maps the field placeholder to on-surface-variant, as the M3 select bridge does (M3)', () => {
    expect(compiledCss()).toMatch(
      /cngx-form-field\)\s*\{[^}]*--cngx-field-placeholder-color: var\(--mat-sys-on-surface-variant\)/,
    );
  });

  // mat-form-field appearance="outline", density 0: 24px line + 2 * 15px
  // padding + 2 * 1px edge = 56px, 4px corners, body-large in the control,
  // body-small on the subscript line inset 16px.
  it('brings the outlined control and the subscript line onto the M3 metrics (M3)', () => {
    const css = compiledCss();
    expect(css).toMatch(
      /:where\(cngx-form-field :is\(input[^{]*\{[^}]*padding-block: calc\(var\(--cngx-space-md, 16px\) - 1px\);\s*padding-inline: calc\(var\(--cngx-space-md, 16px\) - 1px\);\s*border-radius: 4px;/,
    );
    expect(css).toMatch(
      /:where\(cngx-form-field :is\(input[^{]*\{[^}]*letter-spacing: var\(--mat-sys-body-large-tracking\)/,
    );
    expect(css).toMatch(
      /:where\(cngx-form-field :is\(\.cngx-hint, \.cngx-field-error, cngx-field-errors > p, \.cngx-char-count__readout\)\)\s*\{\s*padding-inline: var\(--cngx-space-md, 16px\)/,
    );
    // `.cngx-error` is the state hook CngxErrorState and CngxErrorAggregator set
    // on any container; the manual error container is `.cngx-field-error`.
    expect(css).not.toContain('.cngx-error');
    expect(css).toMatch(
      /:where\(cngx-form-field :is\(\.cngx-hint, cngx-field-errors[^{]*\{[^}]*line-height: var\(--mat-sys-body-small-line-height\);\s*letter-spacing: var\(--mat-sys-body-small-tracking\)/,
    );
    expect(css).toMatch(/--cngx-field-hint-font-size: var\(--mat-sys-body-small-size, 0\.75rem\)/);
    // mat-hint bottom-aligns its 16px line, so its text already sits one cngx
    // hint gap below the edge: the gap stays on the cngx scale.
    expect(css).not.toContain('--cngx-field-hint-gap');
  });

  it('sizes the box affixes like matIconPrefix and a matIconButton suffix', () => {
    const css = compiledCss();
    expect(css).toMatch(
      /\.cngx-field-box\.cngx-field-box:is\(\[data-skin=["']?fill["']?\], \[data-skin=["']?outline["']?\]\)\s*\{\s*--cngx-field-affix-icon-size: 1\.5em;\s*--cngx-field-affix-target: 2\.5rem;/,
    );
    expect(css).toMatch(
      /:has\(> \.cngx-field-suffix\.cngx-field-affix--interactive:last-child\)\s*\{\s*padding-inline-end: 0;/,
    );
    expect(css).toMatch(
      /> \.cngx-field-suffix\.cngx-field-affix--interactive:last-child\s*\{[^}]*border-radius: var\(--mat-sys-corner-full, 9999px\)/,
    );
  });

  // mat-hint and the counter end hint carry no colour and inherit the page
  // text, so the bridge maps both to the text role, never the muted one.
  it('paints hint and char-count in the text role, the over-limit count in the error role', () => {
    const v1 = compiledCss();
    expect(v1).toContain('--cngx-field-hint-color: var(--mat-sys-on-surface);');
    expect(v1).toContain('--cngx-field-char-count-color: var(--mat-sys-on-surface);');
    expect(v1).toContain('--cngx-field-char-count-over-color: var(--mat-sys-error);');
  });

  // The box class is the stable hook; the affix-row class only survives as a
  // deprecated alias and must not be what the bridge depends on.
  it('keys the skin tokens on the field box class', () => {
    const css = compiledCss();
    expect(css).toContain('.cngx-field-box[data-skin]');
    expect(css).not.toContain('.cngx-field-affix-row');
  });
});

// The field skins read the two derived core rungs (focus underline, bare
// error text); without a bridge mapping they would keep the Ember / cngx red
// under a Material theme.
describe('system Material bridge', () => {
  function systemCss(): string {
    return compileThemeEntry(
      `
@use '@angular/material' as mat;
@use 'material/system-bridge' as bridge;
$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
html { @include bridge.theme($theme); }
`,
    );
  }

  it('maps the strong primary, primary text and danger text rungs (M3)', () => {
    const css = systemCss();
    expect(css).toContain('--cngx-color-primary-strong: var(--mat-sys-primary)');
    expect(css).toContain('--cngx-color-border-strong: var(--mat-sys-outline);');
    expect(css).toContain('--cngx-color-primary-text: var(--mat-sys-primary)');
    expect(css).toContain('--cngx-color-danger-text: var(--mat-sys-error)');
  });
});
