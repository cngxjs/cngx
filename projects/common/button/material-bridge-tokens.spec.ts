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
  '--cngx-button-hover-layer',
  '--cngx-button-hover-shade',
  '--cngx-button-icon-size',
  '--cngx-button-padding-block',
  '--cngx-button-padding-inline',
  '--cngx-button-pressed-layer',
  '--cngx-button-pressed-wash',
  '--cngx-button-radius',
  '--cngx-button-secondary-bg',
  '--cngx-button-secondary-bg-hover',
  '--cngx-button-secondary-bg-pressed',
  '--cngx-button-secondary-color',
  '--cngx-button-tone',
  '--cngx-button-tone-text',
  '--cngx-close-button-color',
  '--cngx-close-button-hover-bg',
  '--cngx-close-button-icon-size',
  '--cngx-close-button-pressed-bg',
  '--cngx-close-button-radius',
  '--cngx-close-button-size',
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

// Sass breaks a long color-mix() over lines; compare on one line.
function flat(css: string): string {
  return css.replace(/\s+/g, ' ').replace(/\(\s/g, '(').replace(/\s\)/g, ')');
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
      (name) => !name.startsWith('--cngx-color-'),
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
      expect(flat(tonal)).toContain(
        `--cngx-button-secondary-bg-pressed: color-mix(in srgb, var(--mat-sys-${onContainer}) calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%), var(--mat-sys-${container}))`,
      );
    }
  });

  it('maps the state layers onto the M3 hover and pressed opacities (M3), M2 keeps the default', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const host = block(css, '.cngx-button');
    expect(host).toContain(
      '--cngx-button-hover-layer: calc(var(--mat-sys-hover-state-layer-opacity, 0.08) * 100%)',
    );
    expect(host).toContain(
      '--cngx-button-pressed-layer: calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%)',
    );
    expect(host).toContain(
      '--cngx-button-pressed-wash: calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%)',
    );
    expect(flat(css)).toContain(
      '--cngx-close-button-hover-bg: color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity, 0.08) * 100%), transparent)',
    );
    expect(flat(css)).toContain(
      '--cngx-close-button-pressed-bg: color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%), transparent)',
    );
    expect(compileThemeEntry(M2_ENTRY)).not.toContain('pressed');
  });

  it('rounds the family to corner-full in M3 only', () => {
    const m3 = compileThemeEntry(M3_ENTRY);
    expect(flat(m3)).toContain(
      '.cngx-button:not(.cngx-close-button) { --cngx-button-radius: var(--mat-sys-corner-full); }',
    );
    // The radius rung stays untouched, so projected children keep theirs.
    expect(m3).not.toContain('--cngx-radius-md');
    expect(block(m3, '.cngx-button-group')).toContain(
      '--cngx-button-group-radius: var(--mat-sys-corner-full)',
    );
    expect(m3).toContain('--cngx-close-button-radius: var(--mat-sys-corner-full)');
    expect(compileThemeEntry(M2_ENTRY)).not.toContain('radius');
  });

  it('bridges the menu-button caret and the split-button seam in M3 only', () => {
    const m3 = flat(compileThemeEntry(M3_ENTRY));
    expect(m3).toContain(
      '--cngx-icon-size: var(--cngx-menu-button-caret-size, var(--cngx-button-icon-size, 1.25em))',
    );
    expect(m3).toContain('gap: calc(var(--cngx-space-xs, 4px) / 2)');
    expect(m3).toContain('border-start-end-radius: var(--mat-sys-corner-extra-small, 4px)');
    expect(m3).toContain('border-start-start-radius: var(--mat-sys-corner-extra-small, 4px)');
    expect(m3).toContain('border-inline-start-color: var(--cngx-button-tone, currentColor)');
    expect(m3).not.toContain('data-expanded');
    const m2 = compileThemeEntry(M2_ENTRY);
    expect(m2).not.toContain('cngx-split-button');
    expect(m2).not.toContain('cngx-menu-button');
  });

  it('inks neutral outline, ghost and link labels primary and neutral icon buttons on-surface-variant in M3 only', () => {
    const m3 = flat(compileThemeEntry(M3_ENTRY));
    expect(m3).toContain('--cngx-button-tone-text: var(--mat-sys-primary)');
    expect(m3).toContain('--cngx-button-tone-text: var(--mat-sys-on-surface-variant)');
    // A neutral link takes the text-button ink, never on-surface next to its
    // neutral outline / ghost siblings.
    expect(m3).toContain(
      '.cngx-button:is([data-variant=outline], [data-variant=ghost], [data-variant=link])[data-tone=neutral]:not(.cngx-icon-button, .cngx-close-button)',
    );
    expect(compileThemeEntry(M2_ENTRY)).not.toContain('--cngx-button-tone');
  });

  it('keeps the close-button tokens the old close-button bridge set', () => {
    const m3 = compileThemeEntry(M3_ENTRY);
    // The hover wash is the M3 hover state layer (8% at the default opacity).
    expect(flat(m3)).toContain('--cngx-close-button-hover-bg: color-mix(in srgb, var(--mat-sys-on-surface)');
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
        /^(?:calc\()?var\(--cngx-(?:space-(?:xs|sm|md|lg|xl), \d+px|button-padding-inline, var\(--cngx-space-lg, 24px\))\)/,
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
    // M3 Expressive XS (32) and S (40) buttons use label-large: our sm and md
    // take it; xs (28, no M3 twin) keeps label-medium, lg takes title-medium.
    const roles = { xs: 'label-medium', sm: 'label-large', md: 'label-large', lg: 'title-medium' };
    for (const [size, role] of Object.entries(roles)) {
      expect(md(`.cngx-button[data-size=${size}]:not([data-variant=link], .cngx-icon-button)`), size).toContain(
        `--cngx-button-font-size: var(--mat-sys-${role}-size,`,
      );
    }
    // The sm row keeps its 32px box on the taller label-large line: 20 + 2 * 6.
    expect(md('.cngx-button[data-size=sm]:not([data-variant=link])')).toContain(
      '--cngx-button-padding-block: calc(var(--cngx-space-sm, 8px) * 0.75 - var(--cngx-button-border-width, 1px))',
    );
  });

  it('gives the sm close button the md icon-button box through its own hooks (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const close = block(css, '.cngx-close-button[data-size=sm]');
    expect(close).toContain('--cngx-close-button-size: calc(var(--mat-sys-label-large-line-height, 1.25rem)');
    expect(close).toContain('var(--cngx-space-sm, 8px) * 1.25');
    expect(close).toContain('--cngx-close-button-icon-size: calc(var(--cngx-font-size-control, 1rem) * 1.5)');
    expect(compileThemeEntry(M2_ENTRY)).not.toContain('--cngx-close-button-size');
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
