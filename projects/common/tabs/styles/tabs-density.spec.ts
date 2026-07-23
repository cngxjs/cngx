import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the tabs stylesheet. jsdom cannot resolve the
 * real `[data-density]` swap, so this pins the SET-from-scale wiring statically
 * off the raw CSS: every tab spacing token derives from `--cngx-space-*` at the
 * `cngx-tab-group` default host. The vertical strip-to-panel gutter
 * (`--cngx-tab-vertical-gap`) is the token closed in wave 5; the other three
 * derived in wave 4.
 */

const BASE_CSS = readFileSync(resolve(__dirname, 'tabs-base.css'), 'utf8');

/** Every tab spacing token the host must SET from the scale. */
const HOST_SETS: ReadonlyArray<readonly [string, string]> = [
  ['--cngx-tab-gap', 'var(--cngx-space-sm)'],
  ['--cngx-tab-strip-padding', 'var(--cngx-space-sm) 0'],
  ['--cngx-tab-padding', 'var(--cngx-space-sm) var(--cngx-space-sm)'],
  ['--cngx-tab-vertical-gap', 'var(--cngx-space-md)'],
];

describe('tabs density derivation (tabs-base.css)', () => {
  it('SETs every tab spacing token from the scale at the cngx-tab-group host', () => {
    for (const [token, value] of HOST_SETS) {
      expect(BASE_CSS, `${token} must be SET from the scale at cngx-tab-group`).toContain(
        `${token}: ${value};`,
      );
    }
  });

  it('reads the vertical gap through the token so the host SET reaches the use-site', () => {
    expect(BASE_CSS).toContain('gap: var(--cngx-tab-vertical-gap, 1rem);');
  });
});
