import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the data-grid filter field. The SET-from-scale
 * wiring is not observable in jsdom, so this pins it statically off the raw
 * CSS: every filter spacing token derives from `--cngx-space-*` at the
 * `.cngx-dga-filter-field` host, so a global `[data-density]` re-scales the
 * filter row like the rest of the family (data-grid-accordion.component.css).
 */

const CSS = readFileSync(resolve(__dirname, 'data-grid-filter-field.component.css'), 'utf8');

const FILTER_TOKENS: ReadonlyArray<string> = [
  '--cngx-dga-filter-py',
  '--cngx-dga-filter-px',
  '--cngx-dga-filter-label-gap',
  '--cngx-dga-filter-input-py',
  '--cngx-dga-filter-input-px',
];

describe('data-grid filter-field density derivation', () => {
  it('SETs every filter spacing token from the scale at the field host', () => {
    for (const token of FILTER_TOKENS) {
      expect(CSS, `${token} must be SET from --cngx-space-* at the field host`).toMatch(
        new RegExp(`${token.replace(/-/g, '\\-')}:\\s*var\\(--cngx-space-`),
      );
    }
  });
});
