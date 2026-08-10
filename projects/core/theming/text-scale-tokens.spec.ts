import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// jsdom does not model the root `font-size` cascade nor custom-property
// inheritance on descendants, so the behavioural proof (text actually
// scaling ~12.5%) lives in the examples harness (real Chromium); this
// spec guards the source-CSS contract that proof depends on.

const readCss = (name: string): string => readFileSync(resolve(__dirname, name), 'utf-8');

describe('[data-text-size] swap presets', () => {
  const css = readCss('text-scale-tokens.css');

  it('lives in @layer cngx.theme so it beats the @property initial-value', () => {
    expect(css).toMatch(/@layer cngx\.theme\s*{/);
  });

  const PRESETS = [
    { name: 'sm', scale: '0.9375' },
    { name: 'md', scale: '1' },
    { name: 'lg', scale: '1.125' },
  ] as const;

  it.each(PRESETS)(
    '$name declares the attribute + class twin and the expected multiplier',
    ({ name, scale }) => {
      const block = css.match(
        new RegExp(`\\[data-text-size='${name}'\\],\\s*\\.cngx-text-size-${name}\\s*{[^}]+}`),
      );
      expect(block, `${name} block (attribute + class) not found`).not.toBeNull();
      expect(block![0]).toContain(`--cngx-font-scale: ${scale};`);
    },
  );

  it('applies the scale once at html via the font-base * font-scale multiplier', () => {
    expect(css).toMatch(/html\s*{[^}]*font-size:\s*calc\(/);
    expect(css).toContain(
      'font-size: calc(var(--cngx-font-base, 100%) * var(--cngx-font-scale, 1));',
    );
  });
});
