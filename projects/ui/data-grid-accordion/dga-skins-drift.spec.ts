import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DGA_SKINS } from './__test-helpers/dga-skins';

/**
 * Drift guard for the spec-side skin list. The focus-clearance geometry spec
 * iterates `DGA_SKINS`, so a skin added to the stylesheet without joining the
 * list would escape that check. The set is parsed off the raw `@scope` blocks.
 */

// Comments stripped: the file header documents the `@scope` shape with a placeholder.
const CSS = readFileSync(resolve(__dirname, 'data-grid-accordion-skins.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

describe('data-grid-accordion skin list drift', () => {
  it('lists exactly the skins the stylesheet scopes', () => {
    const scoped = new Set(
      [...CSS.matchAll(/@scope\s*\(\.cngx-data-grid-accordion\[data-skin='([^']+)'\]\)/g)].map(
        (match) => match[1],
      ),
    );
    expect(scoped.size).toBeGreaterThan(0);
    expect([...scoped].sort()).toEqual([...DGA_SKINS].sort());
  });
});
