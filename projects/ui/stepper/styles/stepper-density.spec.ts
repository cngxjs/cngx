import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the stepper stylesheets. The SET-from-scale
 * wiring is not observable in jsdom - it cannot resolve `@property`-registered
 * custom properties, and the strip/step spacing only re-scales through a real
 * `[data-density]` swap. So this pins the wiring statically off the raw CSS:
 * every compactness token derives from `--cngx-space-*` at its default host,
 * and stays `inherits: true` so the host SET cascades to the descendant
 * strip / step / panel that read it (the tabs precedent). The repo-wide
 * equivalent lands in the Phase 5 `scripts/__tests__` guard; this one is the
 * stepper-focused Phase 1 net.
 */

const STYLES_DIR = resolve(__dirname);
const BASE_CSS = readFileSync(resolve(STYLES_DIR, 'stepper-base.css'), 'utf8');
const COMPONENT_CSS = readFileSync(resolve(STYLES_DIR, '../stepper.component.css'), 'utf8');

/** Every base strip/step token the host must SET from the scale. */
const BASE_HOST_SETS: ReadonlyArray<readonly [string, string]> = [
  ['--cngx-step-gap', 'var(--cngx-space-sm)'],
  ['--cngx-step-strip-padding', 'var(--cngx-space-sm) 0'],
  ['--cngx-step-padding', 'var(--cngx-space-sm) var(--cngx-space-sm)'],
  ['--cngx-step-padding-inline', 'var(--cngx-space-sm)'],
  ['--cngx-step-padding-compact', 'var(--cngx-space-xs) var(--cngx-space-sm)'],
];

function propertyInherits(css: string, token: string): string | undefined {
  const block = new RegExp(`@property ${token.replace(/-/g, '\\-')}\\s*\\{([^}]*)\\}`).exec(css);
  return block ? /inherits:\s*(true|false)/.exec(block[1])?.[1] : undefined;
}

describe('stepper density derivation (stepper-base.css)', () => {
  it('SETs every base strip/step spacing token from the scale at the default host', () => {
    for (const [token, value] of BASE_HOST_SETS) {
      expect(BASE_CSS).toContain(`${token}: ${value};`);
    }
  });

  it('leaves no base --cngx-step-* gap/padding @property without a scale SET', () => {
    const declared = [
      ...BASE_CSS.matchAll(
        /@property (--cngx-step-[a-z-]*(?:gap|padding|padding-inline|padding-compact))\s*\{/g,
      ),
    ].map((m) => m[1]);
    // At least the five wired tokens must be declared and SET.
    expect(declared.length).toBeGreaterThanOrEqual(BASE_HOST_SETS.length);
    for (const token of declared) {
      expect(BASE_CSS, `${token} declared via @property but never SET from --cngx-space-*`).toMatch(
        new RegExp(`${token.replace(/-/g, '\\-')}:\\s*var\\(--cngx-space-`),
      );
    }
  });

  it('keeps those tokens inherits:true so the host SET cascades to descendants', () => {
    for (const [token] of BASE_HOST_SETS) {
      expect(
        propertyInherits(BASE_CSS, token),
        `${token} must inherit for the host SET to reach the strip/step`,
      ).toBe('true');
    }
  });

  it('SETs the status-pill padding from the scale at the unskinned host', () => {
    expect(BASE_CSS).toMatch(/--cngx-step-status-pill-padding:\s*calc\(var\(--cngx-space-/);
    expect(propertyInherits(COMPONENT_CSS, '--cngx-step-status-pill-padding')).toBe('true');
  });
});

describe('stepper density derivation (chips / breadcrumb / pill skins - wave 5)', () => {
  /** Skin sub-paddings SET at the unskinned host so they are not skin-gated. */
  const SKIN_HOST_SETS: ReadonlyArray<readonly [string, string]> = [
    ['--cngx-step-chips-gap', 'var(--cngx-space-sm)'],
    ['--cngx-step-chips-padding-inline', 'var(--cngx-space-md)'],
    ['--cngx-step-chips-padding-block', 'var(--cngx-space-sm)'],
    ['--cngx-step-breadcrumb-gap', 'var(--cngx-space-sm)'],
    ['--cngx-step-pill-vertical-padding-block', 'var(--cngx-space-md)'],
  ];

  it('SETs every chips / breadcrumb / pill sub-padding from the scale at the host', () => {
    for (const [token, value] of SKIN_HOST_SETS) {
      expect(BASE_CSS, `${token} must be SET from the scale at cngx-stepper`).toContain(
        `${token}: ${value};`,
      );
    }
  });

  it('flips the registered chips / breadcrumb tokens to inherits:true so the host SET cascades', () => {
    // Registered inherits:false would strand the descendant pill on the initial
    // value (feedback_property_inherits_false_trap); the host SET only reaches
    // the skin-scoped descendant once the token inherits.
    for (const token of [
      '--cngx-step-chips-gap',
      '--cngx-step-chips-padding-inline',
      '--cngx-step-chips-padding-block',
      '--cngx-step-breadcrumb-gap',
    ]) {
      expect(propertyInherits(COMPONENT_CSS, token), `${token} must inherit`).toBe('true');
    }
  });

  it('does NOT touch the auto-ladder chips density padding (accepted-debt opt-out)', () => {
    // --cngx-step-chips-density-padding-inline is armed by the strip-overflow
    // resolver, not skin compactness; SETting it from the scale would re-couple
    // strip-overflow density to the global spacing swap.
    expect(BASE_CSS).not.toContain('--cngx-step-chips-density-padding-inline:');
  });

  it('SETs the group-chip padding from the scale (block via half-xs, inline sm)', () => {
    expect(BASE_CSS).toMatch(
      /--cngx-stepper-group-chip-padding:\s*calc\(var\(--cngx-space-xs\) \/ 2\) var\(--cngx-space-sm\)/,
    );
  });

  it('keeps the group-summary padding a font-relative em gauge (density opt-out)', () => {
    // The summary badge is fully em-sized (font 0.75em, size 1.3em); its padding
    // stays 0 0.4em so it scales with the badge font, not the px spacing scale.
    expect(BASE_CSS).not.toMatch(/--cngx-stepper-group-summary-padding:\s*[^;]*var\(--cngx-space-/);
  });
});

describe('stepper density derivation (stepper.component.css)', () => {
  it('carries no raw compactness literal for the tokenised step gap / status-pill padding', () => {
    // A bare literal controlling compactness silently opts out of density; the
    // step slot gap reuses --cngx-step-gap and the pill padding derives from
    // the scale-SET --cngx-step-status-pill-padding.
    expect(COMPONENT_CSS).not.toMatch(/gap:\s*0\.5rem\s*;/);
    expect(COMPONENT_CSS).not.toMatch(/gap:\s*0\.375rem\s*;/);
    expect(COMPONENT_CSS).not.toMatch(/padding:\s*0\.125rem\s+0\.5rem\s*;/);
  });
});

describe('stepper density derivation (footer + dot/text/progress variants)', () => {
  const VARIANT_SETS: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
    [
      'footer/stepper-footer.css',
      [
        '--cngx-stepper-footer-gap',
        '--cngx-stepper-footer-region-gap',
        '--cngx-stepper-footer-padding-block',
      ],
    ],
    ['dot-stepper.component.css', ['--cngx-dot-step-gap']],
    ['text-stepper.component.css', ['--cngx-text-step-gap']],
    ['progress-bar-stepper.component.css', ['--cngx-progress-bar-stepper-gap']],
  ];

  for (const [file, tokens] of VARIANT_SETS) {
    it(`SETs ${tokens.join(' / ')} from the scale at the ${file} host`, () => {
      const css = readFileSync(resolve(STYLES_DIR, '..', file), 'utf8');
      for (const token of tokens) {
        expect(css, `${token} must be SET from --cngx-space-* at its variant host`).toMatch(
          new RegExp(`${token.replace(/-/g, '\\-')}:\\s*var\\(--cngx-space-`),
        );
      }
    });
  }
});
