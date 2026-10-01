import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the two derived colour rungs. The rendered ratios
// are asserted in the Chromium tier (`cngx-field-skin.geometry.spec.ts`).

const css = readFileSync(resolve(__dirname, 'system-tokens.css'), 'utf-8');

const DANGER_TEXT =
  '--cngx-color-danger-text: color-mix(in oklab, var(--cngx-color-danger) 75%, var(--cngx-color-text));';

function schemeBlock(pattern: RegExp): string {
  const match = css.match(pattern);
  expect(match, `${pattern} not found`).not.toBeNull();
  return match![0];
}

const BLOCKS = {
  light: () => schemeBlock(/\n {2}:root {[^}]+}/),
  'os dark': () =>
    schemeBlock(/:root:not\(\[data-color-scheme='light'\]\):not\(\.light\) {[^}]+}/),
  'explicit dark': () => schemeBlock(/\[data-color-scheme='dark'\],\s*\.dark {[^}]+}/),
  'explicit light': () => schemeBlock(/\[data-color-scheme='light'\],\s*\.light {[^}]+}/),
};

describe('--cngx-color-primary-strong', () => {
  it('registers as an inheriting colour with the light rung as initial', () => {
    const block = schemeBlock(/@property --cngx-color-primary-strong\s*{[^}]+}/);
    expect(block).toContain("syntax: '<color>'");
    expect(block).toContain('inherits: true');
    expect(block).toContain('initial-value: oklch(0.58 0.19 50)');
  });

  it.each([
    ['light', 'oklch(0.58 0.19 50)'],
    ['os dark', 'oklch(0.72 0.18 50)'],
    ['explicit dark', 'oklch(0.72 0.18 50)'],
    ['explicit light', 'oklch(0.58 0.19 50)'],
  ] as const)('is set in the %s block', (scheme, value) => {
    expect(BLOCKS[scheme]()).toContain(`--cngx-color-primary-strong: ${value};`);
  });
});

describe('--cngx-color-danger-text', () => {
  // A registered initial-value cannot hold var(), so a registration would pin
  // a literal and the derivation from --cngx-color-danger would never apply.
  it('is not registered', () => {
    expect(css).not.toMatch(/@property --cngx-color-danger-text/);
  });

  it.each(Object.keys(BLOCKS) as (keyof typeof BLOCKS)[])(
    'derives from danger and text in oklab in the %s block',
    (scheme) => {
      expect(BLOCKS[scheme]()).toContain(DANGER_TEXT);
    },
  );
});

describe('--cngx-color-highlight', () => {
  // Readers (the command palette match <mark>) paint the inherited body text on
  // this fill, so the dark rung is a dark amber, never the light pale yellow.
  it('registers as an inheriting colour with the light rung as initial', () => {
    const block = schemeBlock(/@property --cngx-color-highlight\s*{[^}]+}/);
    expect(block).toContain("syntax: '<color>'");
    expect(block).toContain('inherits: true');
    expect(block).toContain('initial-value: oklch(0.92 0.115 96)');
  });

  it.each([
    ['light', 'oklch(0.92 0.115 96)'],
    ['os dark', 'oklch(0.45 0.08 95)'],
    ['explicit dark', 'oklch(0.45 0.08 95)'],
    ['explicit light', 'oklch(0.92 0.115 96)'],
  ] as const)('is set in the %s block', (scheme, value) => {
    expect(BLOCKS[scheme]()).toContain(`--cngx-color-highlight: ${value};`);
  });
});
