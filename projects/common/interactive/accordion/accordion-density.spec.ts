import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Density-derivation guard for the standalone `@cngx/common` accordion skin.
 * The SET-from-scale wiring is not observable in jsdom, so this pins it
 * statically off the raw Track-B CSS: the `.cngx-accordion` default host SETs
 * header + region padding from `--cngx-space-*`, so a bare `@cngx/common`
 * accordion densifies without the `@cngx/ui/accordion` organism.
 */

const CSS = readFileSync(
  resolve(__dirname, '../../theming/components/cngx-accordion.css'),
  'utf8',
);

describe('standalone accordion density derivation', () => {
  it('SETs header padding, region padding + header gap from the scale at the .cngx-accordion host', () => {
    for (const token of [
      '--cngx-accordion-header-padding',
      '--cngx-accordion-region-padding',
      '--cngx-accordion-header-gap',
    ]) {
      expect(CSS, `${token} must be SET from --cngx-space-* at the standalone host`).toMatch(
        new RegExp(`${token.replace(/-/g, '\\-')}:\\s*var\\(--cngx-space-`),
      );
    }
  });

  it('leaves no raw gap literal on the header button', () => {
    expect(CSS).not.toMatch(/gap:\s*0\.5rem\s*;/);
  });

  it('opts in by class, so an organism that composes the directives is not reached', () => {
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/\[cngxAccordion/);
    expect(rules).toMatch(/\.cngx-accordion__header\s*\{/);
  });
});
