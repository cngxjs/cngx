import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source-CSS contract for the derived colour rungs. The rendered ratios are
// asserted in the Chromium tier (`cngx-field-skin.geometry.spec.ts`,
// `color-primary-text.geometry.spec.ts` in the forms target).

const css = readFileSync(resolve(__dirname, 'system-tokens.css'), 'utf-8');

// The four tone rungs keep the tone's hue and chroma and pin the lightness
// per scheme and per tone, so a brand override re-hues them while the
// contrast pairing against the fixed surface and inks holds.
function derived(tone: 'primary' | 'danger', lightness: string): string {
  return `oklch(from var(--cngx-color-${tone}) ${lightness} c h)`;
}

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
    ['light', derived('primary', '0.58')],
    ['os dark', derived('primary', '0.72')],
    ['explicit dark', derived('primary', '0.72')],
    ['explicit light', derived('primary', '0.58')],
  ] as const)('derives from primary in the %s block', (scheme, value) => {
    expect(BLOCKS[scheme]()).toContain(`--cngx-color-primary-strong: ${value};`);
  });
});

describe.each([
  [
    '--cngx-color-border-strong',
    'oklch(0.62 0.005 250)',
    'oklch(0.62 0.005 250)',
    'oklch(0.57 0.005 250)',
  ],
  ['--cngx-color-on-primary-strong', 'oklch(1 0 0)', 'oklch(1 0 0)', 'oklch(0.2 0.01 250)'],
  [
    '--cngx-color-danger-strong',
    'oklch(0.48 0.18 25)',
    derived('danger', '0.48'),
    derived('danger', '0.68'),
  ],
  ['--cngx-color-on-danger-strong', 'oklch(1 0 0)', 'oklch(1 0 0)', 'oklch(0.2 0.01 250)'],
] as const)('%s', (token, initial, light, dark) => {
  it('registers as an inheriting colour with the light rung as initial', () => {
    const block = schemeBlock(new RegExp(`@property ${token}\\s*{[^}]+}`));
    expect(block).toContain("syntax: '<color>'");
    expect(block).toContain('inherits: true');
    expect(block).toContain(`initial-value: ${initial}`);
  });

  it.each([
    ['light', light],
    ['os dark', dark],
    ['explicit dark', dark],
    ['explicit light', light],
  ] as const)('is set in the %s block', (scheme, value) => {
    expect(BLOCKS[scheme]()).toContain(`${token}: ${value};`);
  });
});

describe('--cngx-color-primary-text', () => {
  // Same reason as the danger rung: a registration would pin a literal and
  // the derivation from a consumer's --cngx-color-primary would never apply.
  it('is not registered', () => {
    expect(css).not.toMatch(/@property --cngx-color-primary-text/);
  });

  it.each([
    ['light', '0.54'],
    ['os dark', '0.8'],
    ['explicit dark', '0.8'],
    ['explicit light', '0.54'],
  ] as const)('derives from primary in the %s block', (scheme, lightness) => {
    expect(BLOCKS[scheme]()).toContain(
      `--cngx-color-primary-text: ${derived('primary', lightness)};`,
    );
  });
});

describe('--cngx-color-danger-text', () => {
  // A registered initial-value cannot hold var(), so a registration would pin
  // a literal and the derivation from --cngx-color-danger would never apply.
  it('is not registered', () => {
    expect(css).not.toMatch(/@property --cngx-color-danger-text/);
  });

  it.each([
    ['light', '0.46'],
    ['os dark', '0.74'],
    ['explicit dark', '0.74'],
    ['explicit light', '0.46'],
  ] as const)('derives from danger in the %s block', (scheme, lightness) => {
    expect(BLOCKS[scheme]()).toContain(`--cngx-color-danger-text: ${derived('danger', lightness)};`);
  });
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
