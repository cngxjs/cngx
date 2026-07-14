import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// jsdom does not model CSS `@property { inherits }` semantics nor
// custom-property inheritance on descendants (getComputedStyle returns
// '' for an inherited custom property). The behavioural cascade proof
// therefore lives in the examples e2e harness (real Chromium); these
// specs guard the source-CSS contract those probes depend on.

const readCss = (name: string): string =>
  readFileSync(resolve(__dirname, name), 'utf-8');

const SPACING_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

describe('spacing scale is inheritable', () => {
  const css = readCss('system-tokens.css');

  it.each(SPACING_TOKENS)(
    '--cngx-space-%s registers inherits: true so [data-density] can cascade',
    (size) => {
      const block = css.match(
        new RegExp(`@property --cngx-space-${size}\\s*{[^}]+}`),
      );
      expect(block, `@property --cngx-space-${size} registration not found`).not.toBeNull();
      expect(block![0]).toContain('inherits: true');
      expect(block![0]).not.toContain('inherits: false');
    },
  );
});

describe('[data-density] swap presets', () => {
  const css = readCss('density-tokens.css');

  it('lives in @layer cngx.theme so it beats the @property initial-value', () => {
    expect(css).toMatch(/@layer cngx\.theme\s*{/);
  });

  const PRESETS = [
    { name: 'comfortable', md: '16px', xs: '4px', xl: '32px' },
    { name: 'compact', md: '8px', xs: '2px', xl: '16px' },
    { name: 'spacious', md: '20px', xs: '6px', xl: '40px' },
  ] as const;

  it.each(PRESETS)(
    '$name declares the attribute + class twin and the expected scale',
    ({ name, md, xs, xl }) => {
      const block = css.match(
        new RegExp(
          `\\[data-density='${name}'\\],\\s*\\.cngx-density-${name}\\s*{[^}]+}`,
        ),
      );
      expect(block, `${name} block (attribute + class) not found`).not.toBeNull();
      expect(block![0]).toContain(`--cngx-space-xs: ${xs};`);
      expect(block![0]).toContain(`--cngx-space-md: ${md};`);
      expect(block![0]).toContain(`--cngx-space-xl: ${xl};`);
    },
  );
});
