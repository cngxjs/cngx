import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the bare-element placeholder. The rendered 4.5:1
// ratio is asserted in the Chromium tier (`cngx-field-skin.geometry.spec.ts`).

const css = readFileSync(resolve(__dirname, 'base.css'), 'utf-8');
const contrastCss = readFileSync(resolve(__dirname, 'contrast-tokens.css'), 'utf-8');

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

// Under more contrast the boost lifts muted text to full text, so the
// placeholder would match a typed value. It is set apart by shape and tone.
describe('cngx.theme placeholder under more contrast', () => {
  const MIX = 'color: color-mix(in oklab, var(--cngx-color-text) 75%, var(--cngx-color-surface))';

  it.each([
    [
      'the attribute and its class twin',
      /\[data-contrast='more'\] ::placeholder,\s*\.cngx-contrast-more ::placeholder\s*{[^}]+}/,
    ],
    ['the OS preference', /:root:not\(\[data-contrast='normal'\]\) ::placeholder\s*{[^}]+}/],
  ])('sets the placeholder in italic and a 75%% text mix for %s', (_, pattern) => {
    const rule = contrastCss.match(pattern);
    expect(rule, `${pattern} not found`).not.toBeNull();
    expect(rule![0]).toContain('font-style: italic');
    expect(rule![0]).toContain(MIX);
  });

  // An unlayered rule would beat a consumer's own placeholder colour.
  it('keeps both rules inside the cngx.theme layer', () => {
    const layer = contrastCss.slice(contrastCss.indexOf('@layer cngx.theme {'));
    const end = layer.indexOf('\n}\n');
    expect(layer.slice(0, end)).toContain(":root:not([data-contrast='normal']) ::placeholder");
    expect(layer.slice(0, end)).toContain("[data-contrast='more'] ::placeholder");
  });
});
