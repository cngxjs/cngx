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
