import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the default breadcrumb bar. The SET-from-scale
 * wiring is not observable in jsdom, so this pins it statically off the raw
 * CSS: the unskinned `.cngx-breadcrumb` host SETs the list gap from the scale
 * (wave 3 fixed the overflow / sibling scopes; only the bar default lagged).
 */

const CSS = readFileSync(resolve(__dirname, 'breadcrumb-bar.component.css'), 'utf8');

describe('breadcrumb bar density derivation', () => {
  it('SETs the default bar gap from the scale at the unskinned host', () => {
    expect(CSS).toMatch(/\.cngx-breadcrumb\s*\{[^}]*--cngx-breadcrumb-gap:\s*var\(--cngx-space-/);
  });
});
