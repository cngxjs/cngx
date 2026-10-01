import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the bare `<dt>`. The rendered colour in both schemes
// is asserted in the Chromium tier (`base-dl.geometry.spec.ts` in
// projects/forms/theming/components, next to the other base.css reads).

const css = readFileSync(resolve(__dirname, 'base.css'), 'utf-8');

describe('cngx.base description term', () => {
  const rule = css.match(/dl > dt\s*{[^}]+}/);

  it('paints the term in the muted text colour', () => {
    expect(rule, 'dl > dt rule not found').not.toBeNull();
    expect(rule![0]).toContain('color: var(--cngx-color-text-muted');
  });

  // Quiet by colour, never opacity: opacity compounds with whatever wraps the
  // list and survives forced colors as a bare fade.
  it('does not fade the term with opacity', () => {
    expect(rule![0]).not.toContain('opacity');
  });
});
