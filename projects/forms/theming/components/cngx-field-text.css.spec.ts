import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-text tier for the field typography. The computed colours and their
// contrast live in `cngx-field-skin.geometry.spec.ts`.

const SOURCE = readFileSync(
  resolve(process.cwd(), 'projects/forms/theming/components/cngx-field-text.css'),
  'utf8',
);
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '');
const FLAT = CODE.replace(/\s+/g, ' ');

describe('cngx-field-text.css', () => {
  it('ships through the cngx.css aggregate', () => {
    const aggregate = readFileSync(resolve(process.cwd(), 'projects/themes/cngx.css'), 'utf8');
    expect(aggregate).toContain("@import '../forms/theming/components/cngx-field-text.css';");
  });

  // An attribute selector on cngxLabel / cngxHint would paint every organism
  // that reuses the directive on its own element.
  it('keys on classes and the error element, never on directive attributes', () => {
    expect(CODE).not.toMatch(/\[cngx/i);
    for (const selector of ['.cngx-label {', '.cngx-hint {', 'cngx-field-errors, .cngx-error {']) {
      expect(FLAT).toContain(selector);
    }
  });

  it('paints every colour through a token, with literals only as var() fallbacks', () => {
    // The forced-colors block names system colours (GrayText) by design.
    const themed = FLAT.slice(0, FLAT.indexOf('@media (forced-colors: active)'));
    const colours = [...themed.matchAll(/color: ([^;]+);/g)].map((m) => m[1]);
    expect(colours.length).toBeGreaterThan(0);
    for (const value of colours) {
      expect(value.startsWith('var(') || value.startsWith('color-mix(in oklab, var(')).toBe(true);
    }
  });

  it('reads the error colour hook before the readable danger text rung', () => {
    const error = FLAT.slice(FLAT.indexOf('.cngx-label.cngx-label--error'));
    expect(error).toMatch(
      /^[^}]*color: var\( --cngx-field-error-color, var\( --cngx-color-danger-text,/,
    );
    const list = FLAT.slice(FLAT.indexOf('cngx-field-errors, .cngx-error {'));
    expect(list).toMatch(
      /^[^}]*color: var\( --cngx-field-error-color, var\( --cngx-color-danger-text,/,
    );
  });

  // A registered colour initial would defeat the fallback chain and pin the
  // light value in dark mode.
  it('leaves the colour tokens unregistered', () => {
    for (const token of [
      '--cngx-field-label-color',
      '--cngx-field-hint-color',
      '--cngx-field-error-color',
    ]) {
      expect(CODE).not.toContain(`@property ${token}`);
    }
  });

  it('disables by colour, never by opacity', () => {
    expect(CODE).not.toContain('opacity');
  });
});
