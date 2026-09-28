import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the bare-element placeholder. The rendered 4.5:1
// ratio is asserted in the Chromium tier (`cngx-field-skin.geometry.spec.ts`).

const css = readFileSync(resolve(__dirname, 'base.css'), 'utf-8');

describe('cngx.base placeholder', () => {
  const rule = css.match(/input::placeholder,\s*textarea::placeholder\s*{[^}]+}/);

  it('paints input and textarea placeholders in the muted text colour', () => {
    expect(rule, 'placeholder rule not found').not.toBeNull();
    expect(rule![0]).toContain('color: var(--cngx-color-text-muted');
  });

  // The UA placeholder carries its own opacity, which would multiply the
  // muted colour back under 4.5:1.
  it('resets the UA placeholder opacity', () => {
    expect(rule![0]).toContain('opacity: 1');
  });

  // Tokens belong to components, not elements: a bare element reads system
  // tokens only.
  it('reads no component token', () => {
    expect(rule![0]).not.toMatch(/--cngx-(field|input|select)-/);
  });
});
