import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
  '--cngx-color-border-strong',
  '--cngx-color-danger',
  '--cngx-color-danger-strong',
  '--cngx-color-danger-text',
  '--cngx-color-on-danger-strong',
  '--cngx-color-on-primary-strong',
  '--cngx-color-primary',
  '--cngx-color-primary-strong',
  '--cngx-color-primary-text',
  '--cngx-color-surface',
  '--cngx-color-text',
  '--cngx-icon-button-size',
  '--cngx-icon-size',
];

// Scheme knobs a theme typed light or dark sets from its type; a color-scheme
// theme leaves them to the sheet's scheme blocks.
const SCHEME_KNOBS = [
  '--cngx-button-neutral-solid',
  '--cngx-button-neutral-solid-hover',
  '--cngx-button-neutral-solid-pressed',
  '--cngx-button-neutral-tint',
  '--cngx-button-neutral-tint-hover',
  '--cngx-button-neutral-tint-pressed',
  '--cngx-button-secondary-text-shift',
];

const BUTTON_SHEET = 'projects/common/theming/components/cngx-button.css';

const READERS = [
  'projects/common/button/close-button.component.css',
  BUTTON_SHEET,
  'projects/common/display/icon/icon.component.css',
  'projects/common/theming/components/cngx-button-group.css',
];

// The compiled bridge goes through the CSSOM, so a declaration is read by
// property name off its rule instead of matched as text.
function styleRules(css: string): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const rules: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList): void => {
    for (const rule of Array.from(list)) {
      if ('selectorText' in rule) {
        rules.push(rule as CSSStyleRule);
      }
      if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  walk(style.sheet?.cssRules ?? ([] as unknown as CSSRuleList));
  style.remove();
  return rules;
}

// The CSSOM serialises attribute values quoted; the selectors below are not.
const unquoted = (selector: string): string => selector.replaceAll('"', '');

/** Top-level members of a selector list (a comma inside `:is()` / `:not()` stays). */
function members(selectorText: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i];
    if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      out.push(selectorText.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(selectorText.slice(start).trim());
  return out;
}

const holds = (rule: CSSStyleRule, selector: string): boolean =>
  members(unquoted(rule.selectorText)).includes(selector);

// Sass breaks a long color-mix() over lines; compare on one line.
function flat(css: string): string {
  return css.replace(/\s+/g, ' ').replace(/\(\s/g, '(').replace(/\s\)/g, ')');
}

/** Declarations of every rule whose selector list holds `selector`, later rules winning. */
function declarations(css: string, selector: string): ReadonlyMap<string, string> {
  const matching = styleRules(css).filter((rule) => holds(rule, selector));
  if (matching.length === 0) {
    throw new Error(`no ${selector} rule emitted`);
  }
  const out = new Map<string, string>();
  for (const rule of matching) {
    for (const name of Array.from(rule.style)) {
      out.set(name, flat(rule.style.getPropertyValue(name).trim()));
    }
  }
  return out;
}

/** The full selector list of the rule that holds `selector`. */
function selectorList(css: string, selector: string): string {
  const rule = styleRules(css).find((r) => holds(r, selector));
  if (!rule) {
    throw new Error(`no ${selector} rule emitted`);
  }
  return unquoted(rule.selectorText);
}

const block = (css: string, selector: string): ReadonlyMap<string, string> =>
  declarations(css, `:where(${selector})`);

describe('button Material bridge', () => {
  it('emits only consumed token names (M3)', () => {
    expect(emittedTokenNames(compileThemeEntry(M3_ENTRY))).toEqual(
      [...CONSUMED, ...SCHEME_KNOBS].sort(),
    );
  });

  it('leaves the scheme knobs to the sheet on a color-scheme theme (M3)', () => {
    const names = emittedTokenNames(
      compileThemeEntry(M3_ENTRY.replace('theme-type: light', 'theme-type: color-scheme')),
    );
    expect(names).toEqual(CONSUMED);
  });


  it('sets the scheme knobs from the theme type to the sheet literals (M3)', () => {
    // The bridge copies the sheet's scheme blocks; read both from the sheet so
    // a rung change there fails here instead of leaving the bridge stale.
    const sheet = readFileSync(
      fileURLToPath(new URL('../../../' + BUTTON_SHEET, import.meta.url)),
      'utf-8',
    );
    const sheetBlock = (selector: string): string => {
      const start = sheet.indexOf(selector);
      if (start < 0) {
        throw new Error(`no ${selector} block in cngx-button.css`);
      }
      return sheet.slice(start, sheet.indexOf('}', start));
    };
    const literal = (css: string, name: string): string | undefined =>
      css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
    const light = sheetBlock("[data-color-scheme='light'],");
    const dark = sheetBlock("[data-color-scheme='dark'],");
    const types = [
      ['M3 light', M3_ENTRY, light],
      ['M3 dark', M3_ENTRY.replace('theme-type: light', 'theme-type: dark'), dark],
    ] as const;
    for (const [type, entry, scheme] of types) {
      const host = block(compileThemeEntry(entry), '.cngx-button');
      for (const name of SCHEME_KNOBS) {
        const expected = literal(scheme, name);
        expect(expected, `${name} missing from the sheet's ${type} block`).toBeDefined();
        expect(host.get(name), `${type} ${name}`).toBe(expected);
      }
    }
  });

  it('assigns only button-family tokens a button-family sheet reads', () => {
    const sheets = READERS.map((path) =>
      readFileSync(fileURLToPath(new URL('../../../' + path, import.meta.url)), 'utf-8'),
    ).join('\n');
    const owned = [...CONSUMED, ...SCHEME_KNOBS].filter(
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
    expect(host.get('--cngx-color-primary')).toBe('var(--mat-sys-primary)');
    expect(host.get('--cngx-color-primary-strong')).toBe('var(--mat-sys-primary)');
    expect(host.get('--cngx-color-on-primary-strong')).toBe('var(--mat-sys-on-primary)');
    expect(host.get('--cngx-color-danger')).toBe('var(--mat-sys-error)');
    expect(host.get('--cngx-color-danger-strong')).toBe('var(--mat-sys-error)');
    expect(host.get('--cngx-color-on-danger-strong')).toBe('var(--mat-sys-on-error)');
    expect(host.has('--cngx-color-on-primary')).toBe(false);
    expect(host.has('--cngx-color-on-danger')).toBe(false);
    expect(block(css, '.cngx-button[data-tone=primary]').get('--cngx-button-hover-shade')).toBe(
      'var(--mat-sys-on-primary)',
    );
    expect(block(css, '.cngx-button[data-tone=danger]').get('--cngx-button-hover-shade')).toBe(
      'var(--mat-sys-on-error)',
    );
    expect(block(css, '.cngx-button[data-variant=outline]').get('--cngx-color-border-strong')).toBe(
      'var(--mat-sys-outline)',
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
      expect(tonal.get('--cngx-button-secondary-bg')).toBe(`var(--mat-sys-${container})`);
      expect(tonal.get('--cngx-button-secondary-color')).toBe(`var(--mat-sys-${onContainer})`);
      expect(tonal.get('--cngx-button-secondary-bg-hover')).toContain(
        '--mat-sys-hover-state-layer-opacity',
      );
      expect(tonal.get('--cngx-button-secondary-bg-pressed')).toBe(
        `color-mix(in srgb, var(--mat-sys-${onContainer}) calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%), var(--mat-sys-${container}))`,
      );
    }
  });

  it('maps the state layers onto the M3 hover and pressed opacities (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const host = block(css, '.cngx-button');
    expect(host.get('--cngx-button-hover-layer')).toBe(
      'calc(var(--mat-sys-hover-state-layer-opacity, 0.08) * 100%)',
    );
    expect(host.get('--cngx-button-pressed-layer')).toBe(
      'calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%)',
    );
    expect(host.get('--cngx-button-pressed-wash')).toBe(
      'calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%)',
    );
    const close = block(css, '.cngx-close-button');
    expect(close.get('--cngx-close-button-hover-bg')).toBe(
      'color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity, 0.08) * 100%), transparent)',
    );
    expect(close.get('--cngx-close-button-pressed-bg')).toBe(
      'color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-pressed-state-layer-opacity, 0.12) * 100%), transparent)',
    );
  });

  it('rounds the family to corner-full (M3)', () => {
    const m3 = compileThemeEntry(M3_ENTRY);
    expect(
      declarations(m3, '.cngx-button:not(.cngx-close-button)').get('--cngx-button-radius'),
    ).toBe('var(--mat-sys-corner-full)');
    // The radius rung stays untouched, so projected children keep theirs.
    expect(m3).not.toContain('--cngx-radius-md');
    expect(block(m3, '.cngx-button-group').get('--cngx-button-group-radius')).toBe(
      'var(--mat-sys-corner-full)',
    );
    expect(block(m3, '.cngx-close-button').get('--cngx-close-button-radius')).toBe(
      'var(--mat-sys-corner-full)',
    );
  });

  it('bridges the menu-button caret and the split-button seam (M3)', () => {
    const m3 = flat(compileThemeEntry(M3_ENTRY));
    expect(m3).toContain(
      '--cngx-icon-size: var(--cngx-menu-button-caret-size, var(--cngx-button-icon-size, 1.25em))',
    );
    expect(m3).toContain('gap: calc(var(--cngx-space-xs, 4px) / 2)');
    expect(m3).toContain('border-start-end-radius: var(--mat-sys-corner-extra-small, 4px)');
    expect(m3).toContain('border-start-start-radius: var(--mat-sys-corner-extra-small, 4px)');
    expect(m3).toContain(
      'border-inline-start-color: var(--cngx-button-tone-fill, var(--cngx-button-tone, currentColor))',
    );
    expect(m3).not.toContain('data-expanded');
  });

  it('inks neutral outline, ghost and link labels primary and neutral icon buttons on-surface-variant (M3)', () => {
    const m3 = flat(compileThemeEntry(M3_ENTRY));
    expect(m3).toContain('--cngx-button-tone-text: var(--mat-sys-primary)');
    expect(m3).toContain('--cngx-button-tone-text: var(--mat-sys-on-surface-variant)');
    // A neutral link takes the text-button ink, never on-surface next to its
    // neutral outline / ghost siblings.
    expect(m3).toContain(
      '.cngx-button:is([data-variant=outline], [data-variant=ghost], [data-variant=link])[data-tone=neutral]:not(.cngx-icon-button, .cngx-close-button)',
    );
  });

  it('keeps the close-button tokens the old close-button bridge set', () => {
    const m3 = block(compileThemeEntry(M3_ENTRY), '.cngx-close-button');
    // The hover wash is the M3 hover state layer (8% at the default opacity).
    expect(m3.get('--cngx-close-button-hover-bg')).toContain(
      'color-mix(in srgb, var(--mat-sys-on-surface)',
    );
    expect(m3.get('--cngx-close-button-color')).toBe('var(--mat-sys-on-surface-variant)');
  });

  it('derives every M3 metric from the --cngx-space-* scale, never a density map (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const paddings = styleRules(css).flatMap((rule) =>
      Array.from(rule.style)
        .filter((name) =>
          [
            '--cngx-button-padding-block',
            '--cngx-button-padding-inline',
            'padding-inline-start',
            'padding-inline-end',
          ].includes(name),
        )
        .map((name) => [name, flat(rule.style.getPropertyValue(name).trim())] as const),
    );
    expect(paddings.length).toBeGreaterThan(0);
    for (const [prop, value] of paddings) {
      // A rung, or a ratio of the inline padding that is itself a rung.
      expect(value, prop).toMatch(
        /^(?:calc\()?var\(--cngx-(?:space-(?:xs|sm|md|lg|xl), \d+px|button-padding-inline, var\(--cngx-space-lg, 24px\))\)/,
      );
    }
    // The selector may head a list (the group addon shares the rule).
    const base = declarations(css, '.cngx-button[data-size=md]:not([data-variant=link])');
    expect(base.get('--cngx-button-padding-inline')).toBe('var(--cngx-space-lg, 24px)');
    expect(base.get('--cngx-button-padding-block')).toBe(
      'calc(var(--cngx-space-sm, 8px) * 1.25 - var(--cngx-button-border-width, 1px))',
    );
    expect(
      declarations(css, '.cngx-button[data-size=md][data-variant=ghost]').get(
        '--cngx-button-padding-inline',
      ),
    ).toBe('calc(var(--cngx-space-sm, 8px) * 1.5)');
    expect(selectorList(css, '.cngx-button[data-size=md]:not([data-variant=link])')).toContain(
      '.cngx-button-group > .cngx-button-group__addon[data-size=md]',
    );
    const typeSelector = '.cngx-button[data-size=md]:not([data-variant=link], .cngx-icon-button)';
    expect(selectorList(css, typeSelector)).toContain(
      '.cngx-button-group > .cngx-button-group__addon[data-size=md]',
    );
    const type = declarations(css, typeSelector);
    expect(type.get('--cngx-button-font-size')).toBe('var(--mat-sys-label-large-size, 0.875rem)');
    expect(type.get('line-height')).toBe('var(--mat-sys-label-large-line-height, 1.25rem)');
    expect(type.get('letter-spacing')).toBe('var(--mat-sys-label-large-tracking, 0.006rem)');
    // M3 Expressive XS (32) and S (40) buttons use label-large: our sm and md
    // take it; xs (28, no M3 twin) keeps label-medium, lg takes title-medium.
    const roles = { xs: 'label-medium', sm: 'label-large', md: 'label-large', lg: 'title-medium' };
    for (const [size, role] of Object.entries(roles)) {
      expect(
        declarations(
          css,
          `.cngx-button[data-size=${size}]:not([data-variant=link], .cngx-icon-button)`,
        ).get('--cngx-button-font-size'),
        size,
      ).toContain(`var(--mat-sys-${role}-size,`);
    }
    // The sm row keeps its 32px box on the taller label-large line: 20 + 2 * 6.
    expect(
      declarations(css, '.cngx-button[data-size=sm]:not([data-variant=link])').get(
        '--cngx-button-padding-block',
      ),
    ).toBe('calc(var(--cngx-space-sm, 8px) * 0.75 - var(--cngx-button-border-width, 1px))');
  });

  it('gives the sm close button the md icon-button box through its own hooks (M3)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const close = block(css, '.cngx-close-button[data-size=sm]');
    expect(close.get('--cngx-close-button-size')).toContain(
      'calc(var(--mat-sys-label-large-line-height, 1.25rem)',
    );
    expect(close.get('--cngx-close-button-size')).toContain('var(--cngx-space-sm, 8px) * 1.25');
    expect(close.get('--cngx-close-button-icon-size')).toBe(
      'calc(var(--cngx-font-size-control, 1rem) * 1.5)',
    );
  });


  it('layers every block and carries no mat-icon rule (the icon bridge sizes wrapped glyphs)', () => {
    const css = compileThemeEntry(M3_ENTRY);
    const unlayered = css.replace(/@layer cngx\.components\s*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, '');
    expect(unlayered.trim()).toBe('');
    expect(css).not.toContain('mat-icon');
  });
});
