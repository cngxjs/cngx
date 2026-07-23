import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the paginator stylesheets. The SET-from-scale
 * wiring is not observable in jsdom - it cannot resolve `@property`-registered
 * custom properties, and the segment spacing only re-scales through a real
 * `[data-density]` swap. So this pins the wiring statically off the raw CSS:
 * every per-segment compactness token derives from `--cngx-space-*` at the
 * `.cngx-paginator` default host (paginator-base.css, inlined into
 * `@cngx/ui/paginator` via styleUrls), and the two registered tokens stay
 * `inherits: true` so the host SET cascades to the descendant panel / row /
 * button that read it. The base row-gap / gap pair already derived in wave 4;
 * this guard covers the segment tokens closed in wave 5.
 */

const BASE_CSS = readFileSync(
  resolve(__dirname, '../../common/data/paginate/styles/paginator-base.css'),
  'utf8',
);
const COMPONENT_CSS = readFileSync(resolve(__dirname, 'paginator.component.css'), 'utf8');

/** Every default-host segment token the base must SET from the scale. */
const HOST_SETS: ReadonlyArray<readonly [string, string]> = [
  ['--cngx-paginator-button-padding', '0 var(--cngx-space-sm)'],
  ['--cngx-paginator-goto-padding', '0 var(--cngx-space-sm)'],
  ['--cngx-paginator-option-padding', '0 var(--cngx-space-sm)'],
  ['--cngx-paginator-panel-padding', 'var(--cngx-space-xs)'],
  ['--cngx-paginator-select-gap', 'var(--cngx-space-xs)'],
  ['--cngx-paginator-overflow-gap', 'var(--cngx-space-xs)'],
  ['--cngx-paginator-alpha-gap', 'var(--cngx-space-sm)'],
  ['--cngx-paginator-infinite-gap', 'var(--cngx-space-sm)'],
  ['--cngx-paginator-load-more-gap', 'var(--cngx-space-sm)'],
  ['--cngx-paginator-infinite-padding', 'var(--cngx-space-md)'],
];

/** The wave-4 base pair, re-asserted so a revert of either flips this red. */
const WAVE_4_SETS: ReadonlyArray<readonly [string, string]> = [
  ['--cngx-paginator-row-gap', 'var(--cngx-space-sm)'],
  ['--cngx-paginator-gap', 'var(--cngx-space-xs)'],
];

function propertyInherits(css: string, token: string): string | undefined {
  const block = new RegExp(`@property ${token.replace(/-/g, '\\-')}\\s*\\{([^}]*)\\}`).exec(css);
  return block ? /inherits:\s*(true|false)/.exec(block[1])?.[1] : undefined;
}

describe('paginator density derivation (paginator-base.css)', () => {
  it('SETs every per-segment spacing token from the scale at the default host', () => {
    for (const [token, value] of HOST_SETS) {
      expect(BASE_CSS, `${token} must be SET from the scale at .cngx-paginator`).toContain(
        `${token}: ${value};`,
      );
    }
  });

  it('keeps the wave-4 row-gap / gap SETs so the pair stays derived', () => {
    for (const [token, value] of WAVE_4_SETS) {
      expect(BASE_CSS).toContain(`${token}: ${value};`);
    }
  });

  it('leaves no derived segment token as a bare literal at the use-site only', () => {
    // A use-site fallback with no host SET silently opts the token out of the
    // [data-density] swap; every derived token above must appear in a SET rule.
    for (const [token] of HOST_SETS) {
      expect(BASE_CSS, `${token} read but never SET from --cngx-space-*`).toMatch(
        new RegExp(`${token.replace(/-/g, '\\-')}:\\s*(?:0\\s+)?var\\(--cngx-space-`),
      );
    }
  });

  it('keeps overflow-cell-padding a deliberate 0-keep (fixed square grid cells)', () => {
    // The overflow menu renders fixed 2rem square cells; a scale SET would break
    // the grid, so this token intentionally stays out of density.
    expect(BASE_CSS).not.toMatch(/--cngx-paginator-overflow-cell-padding:\s*var\(--cngx-space-/);
  });
});

describe('paginator density derivation (paginator.component.css)', () => {
  it('registers the two segment @property tokens as inherits:true so the host SET cascades', () => {
    for (const token of ['--cngx-paginator-option-padding', '--cngx-paginator-panel-padding']) {
      expect(
        propertyInherits(COMPONENT_CSS, token),
        `${token} must inherit for the host SET to reach the panel/row`,
      ).toBe('true');
    }
  });
});
