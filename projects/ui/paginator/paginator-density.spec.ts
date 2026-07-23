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

// Cross-lib raw-CSS read (not a TS import - Sheriff governs imports, not test
// fs reads): the paginator's segment SETs live in @cngx/common/data's
// paginator-base.css, inlined into @cngx/ui/paginator via styleUrls, so this
// wiring pin must read across the lib boundary to see them. Deliberate and
// unique to this guard - do not replicate it as a general test pattern.
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

  // The segmented / minimal-nav / bar skin paddings live inside [data-skin]
  // scopes; a component-token host SET would be skin-gated, so the density
  // mechanism is a direct scale read at the use-site (stepper precedent).
  const SKIN_READS: ReadonlyArray<string> = [
    'padding: var(--cngx-space-xs, 0.25rem);', // segmented track, 0.25rem -> xs
    'gap: var(--cngx-space-sm, 0.4rem);', // minimal nav gap, 0.4rem -> sm
    'padding-inline: var(--cngx-space-md, 0.85rem);', // minimal nav + bar cell, 0.85rem -> md
    'padding-inline: var(--cngx-space-sm, 0.5rem);', // bar page, 0.5rem -> sm
  ];

  const DROPPED_SKIN_TOKENS: ReadonlyArray<string> = [
    '--cngx-paginator-segmented-track-padding',
    '--cngx-paginator-minimal-nav-gap',
    '--cngx-paginator-minimal-nav-padding',
    '--cngx-paginator-bar-cell-padding',
    '--cngx-paginator-bar-page-padding',
  ];

  it('reads the scale directly at every segmented / minimal-nav / bar skin use-site', () => {
    for (const read of SKIN_READS) {
      expect(COMPONENT_CSS, `skin use-site must read the scale: ${read}`).toContain(read);
    }
  });

  it('leaves no skin token as a bare literal read that opts out of density', () => {
    for (const token of DROPPED_SKIN_TOKENS) {
      expect(
        COMPONENT_CSS,
        `${token} still read at a use-site; it no longer derives`,
      ).not.toContain(token);
    }
  });
});
