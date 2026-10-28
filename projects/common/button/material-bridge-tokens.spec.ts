import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileThemeEntry, emittedTokenNames } from '@cngx/testing/sass';

/**
 * Token-name contract for the button-family Material bridge
 * (`projects/themes/material/button-theme.scss`). Pins the emitted
 * `--cngx-*` names, proves every button-owned name is read by a
 * button-family stylesheet (the bridges' historic defect is name drift),
 * and pins the placement: every block layered, no `.mat-icon` rule (a
 * wrapped mat-icon is the icon bridge's job). Rendered sizes are the geometry spec's
 * job (`material-bridge.geometry.spec.ts`).
 */

const M3_ENTRY = `
@use '@angular/material' as mat;
@use 'material/button-theme' as bridge;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

@include bridge.theme($theme);
`;

const M2_ENTRY = `
@use '@angular/material' as mat;
@use 'material/button-theme' as bridge;

$primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$accent: mat.m2-define-palette(mat.$m2-pink-palette);
$theme: mat.m2-define-light-theme((color: (primary: $primary, accent: $accent)));

@include bridge.theme($theme);
`;

// Foundation knobs the button sheet reads (button-toggle-theme precedent: the
// sheet SETs its own tone tokens in :scope, so a leaf assignment would lose)
// plus the leaf tokens the sheets read without a :scope assignment.
const CONSUMED = [
  '--cngx-button-font-size',
  '--cngx-button-font-weight',
  '--cngx-button-group-radius',
  '--cngx-button-hover-shade',
  '--cngx-button-icon-size',
  '--cngx-button-padding-block',
  '--cngx-button-padding-inline',
  '--cngx-button-secondary-bg',
  '--cngx-button-secondary-bg-hover',
  '--cngx-button-secondary-color',
  '--cngx-close-button-color',
  '--cngx-close-button-hover-bg',
  '--cngx-close-button-radius',
  '--cngx-color-border',
  '--cngx-color-danger',
  '--cngx-color-danger-text',
  '--cngx-color-on-danger',
  '--cngx-color-on-primary',
  '--cngx-color-primary',
  '--cngx-color-primary-text',
  '--cngx-color-surface',
  '--cngx-color-text',
  '--cngx-icon-button-size',
  '--cngx-icon-size',
  '--cngx-radius-md',
];

const READERS = [
  'projects/common/button/button.component.css',
  'projects/common/button/close-button.component.css',
  'projects/common/button/icon-button.component.css',
  'projects/common/display/icon/icon.component.css',
  'projects/common/theming/components/cngx-button-group.css',
];

function block(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`:where\\(${escaped}\\)\\s*\\{[^}]*\\}`));
  if (!match) {
    throw new Error(`no :where(${selector}) block emitted`);
  }
  return match[0];
}

describe('button Material bridge', () => {
  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames(compileThemeEntry(M3_ENTRY))).toEqual(CONSUMED);
  });

  it('emits a consumed-name subset (M2)', () => {
    const names = emittedTokenNames(compileThemeEntry(M2_ENTRY));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(CONSUMED).toContain(name);
    }
  });

  it('assigns only button-family tokens a button-family sheet reads', () => {
    const sheets = READERS.map((path) => readFileSync(resolve(process.cwd(), path), 'utf-8')).join(
      '\n',
    );
    const owned = CONSUMED.filter(
      (name) => !name.startsWith('--cngx-color-') && name !== '--cngx-radius-md',
    );
    for (const name of owned) {
      expect(sheets, `${name} is not read by any button-family sheet`).toMatch(
        new RegExp(`var\\(\\s*${name}[,)]`),
      );
    }
  });

  it('maps the tones onto the Material roles and on-colours (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const host = block(css, '.cngx-button');
    expect(host).toContain('--cngx-color-primary: var(--mat-sys-primary)');
    expect(host).toContain('--cngx-color-on-primary: var(--mat-sys-on-primary)');
    expect(host).toContain('--cngx-color-danger: var(--mat-sys-error)');
    expect(host).toContain('--cngx-color-on-danger: var(--mat-sys-on-error)');
    expect(block(css, '.cngx-button[data-tone=primary]')).toContain(
      '--cngx-button-hover-shade: var(--mat-sys-on-primary)',
    );
    expect(block(css, '.cngx-button[data-tone=danger]')).toContain(
      '--cngx-button-hover-shade: var(--mat-sys-on-error)',
    );
    expect(block(css, '.cngx-button[data-variant=outline]')).toContain(
      '--cngx-color-border: var(--mat-sys-outline)',
    );
  });

  it('paints the secondary variant from the container roles per tone (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const pairs = [
      ['neutral', 'secondary-container', 'on-secondary-container'],
      ['primary', 'primary-container', 'on-primary-container'],
      ['danger', 'error-container', 'on-error-container'],
    ] as const;
    for (const [tone, container, onContainer] of pairs) {
      const tonal = block(css, `.cngx-button[data-variant=secondary][data-tone=${tone}]`);
      expect(tonal).toContain(`--cngx-button-secondary-bg: var(--mat-sys-${container})`);
      expect(tonal).toContain(`--cngx-button-secondary-color: var(--mat-sys-${onContainer})`);
      expect(tonal).toContain('--mat-sys-hover-state-layer-opacity');
    }
  });

  it('rounds the family to corner-full in M3 only', () => {
    const m3 = compileThemeEntry(M3_ENTRY);
    expect(m3).toContain('--cngx-radius-md: var(--mat-sys-corner-full)');
    expect(block(m3, '.cngx-button-group')).toContain(
      '--cngx-button-group-radius: var(--mat-sys-corner-full)',
    );
    expect(m3).toContain('--cngx-close-button-radius: var(--mat-sys-corner-full)');
    expect(compileThemeEntry(M2_ENTRY)).not.toContain('radius');
  });

  it('keeps the close-button tokens the old close-button bridge set', () => {
    const m3 = compileThemeEntry(M3_ENTRY);
    expect(m3).toContain(
      '--cngx-close-button-hover-bg: color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent)',
    );
    expect(m3).toContain('--cngx-close-button-color: var(--mat-sys-on-surface-variant)');
    expect(compileThemeEntry(M2_ENTRY)).toContain('--cngx-close-button-color: rgba(0, 0, 0, 0.54)');
  });

  it('derives every M3 metric from the --cngx-space-* scale, never a density map (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const paddings = [
      ...css.matchAll(/(--cngx-button-padding-(?:block|inline)|padding-inline-(?:start|end)):\s*([^;]+);/g),
    ];
    expect(paddings.length).toBeGreaterThan(0);
    for (const [, prop, value] of paddings) {
      // A rung, or a ratio of the inline padding that is itself a rung.
      expect(value, prop).toMatch(
        /^(?:calc\()?var\(--cngx-(?:space-(?:xs|sm|md|lg|xl)|button-padding-inline), \d+px\)/,
      );
    }
    const md = (selector: string): string => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // The selector may head a list (the group addon shares the rule).
      const match = css.match(new RegExp(`${escaped}[^{]*\\{[^}]*\\}`));
      if (!match) {
        throw new Error(`no ${selector} block emitted`);
      }
      return match[0];
    };
    const base = md('.cngx-button[data-size=md]:not([data-variant=link])');
    expect(base).toContain('--cngx-button-padding-inline: var(--cngx-space-lg, 24px)');
    expect(base).toContain(
      '--cngx-button-padding-block: calc(var(--cngx-space-sm, 8px) * 1.25 - var(--cngx-button-border-width, 1px))',
    );
    expect(md('.cngx-button[data-size=md][data-variant=ghost]')).toContain(
      '--cngx-button-padding-inline: calc(var(--cngx-space-sm, 8px) * 1.5)',
    );
    expect(base).toContain('.cngx-button-group > .cngx-button-group__addon[data-size=md]');
    const type = md('.cngx-button[data-size=md]:not([data-variant=link], .cngx-icon-button)');
    expect(type).toContain('.cngx-button-group > .cngx-button-group__addon[data-size=md]');
    expect(type).toContain('--cngx-button-font-size: var(--mat-sys-label-large-size, 0.875rem)');
    expect(type).toContain('line-height: var(--mat-sys-label-large-line-height, 1.25rem)');
    expect(type).toContain('letter-spacing: var(--mat-sys-label-large-tracking, 0.006rem)');
  });

  it('keeps the M2 button on the cngx metrics', () => {
    const css = compileThemeEntry(M2_ENTRY);
    expect(css).not.toContain('--cngx-button-padding');
    expect(css).not.toContain('--cngx-button-font-size');
  });

  it('layers every block and carries no mat-icon rule (the icon bridge sizes wrapped glyphs)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const unlayered = css.replace(/@layer cngx\.components\s*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, '');
    expect(unlayered.trim()).toBe('');
    expect(css).not.toContain('mat-icon');
  });
});
