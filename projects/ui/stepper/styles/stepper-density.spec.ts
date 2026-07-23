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
      ...BASE_CSS.matchAll(/@property (--cngx-step-[a-z-]*(?:gap|padding|padding-inline|padding-compact))\s*\{/g),
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
      expect(propertyInherits(BASE_CSS, token), `${token} must inherit for the host SET to reach the strip/step`).toBe(
        'true',
      );
    }
  });
});
