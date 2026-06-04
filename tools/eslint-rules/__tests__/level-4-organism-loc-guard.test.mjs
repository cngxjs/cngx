import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rule = require('../level-4-organism-loc-guard.js');

function lint(code, options = {}) {
  const linter = new Linter();
  return linter.verify(code, [
    {
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      plugins: {
        local: { rules: { 'level-4-organism-loc-guard': rule } },
      },
      rules: {
        'local/level-4-organism-loc-guard': ['error', options],
      },
    },
  ]);
}

function classWithBody(decorator, sourceLines) {
  const body = Array.from({ length: sourceLines }, (_, i) => `  fld${i} = ${i};`).join('\n');
  return `${decorator}\nexport class X {\n${body}\n}`;
}

describe('local/level-4-organism-loc-guard', () => {
  it('passes when @Component class body is exactly at the threshold', () => {
    const code = classWithBody('@Component({ selector: "x", template: "" })', 5);
    const messages = lint(code, { threshold: 5 });
    expect(messages).toEqual([]);
  });

  it('errors when @Component class body exceeds the threshold', () => {
    const code = classWithBody('@Component({ selector: "x", template: "" })', 6);
    const messages = lint(code, { threshold: 5 });
    expect(messages.length).toBe(1);
    expect(messages[0].messageId).toBe('tooLong');
    expect(messages[0].message).toContain('6 source lines');
    expect(messages[0].message).toContain('threshold is 5');
  });

  it('errors when @Directive class body exceeds the threshold', () => {
    const code = classWithBody('@Directive({ selector: "[x]" })', 4);
    const messages = lint(code, { threshold: 3 });
    expect(messages.length).toBe(1);
    expect(messages[0].messageId).toBe('tooLong');
  });

  it('skips classes without @Component or @Directive', () => {
    const body = Array.from({ length: 50 }, (_, i) => `  f${i} = ${i};`).join('\n');
    const code = `export class Plain {\n${body}\n}`;
    const messages = lint(code, { threshold: 5 });
    expect(messages).toEqual([]);
  });

  it('discounts blank lines from the source-line count', () => {
    const decorator = '@Component({ selector: "x", template: "" })';
    const body = '  a = 1;\n\n\n\n  b = 2;\n\n\n  c = 3;';
    const code = `${decorator}\nexport class X {\n${body}\n}`;
    const messages = lint(code, { threshold: 3 });
    expect(messages).toEqual([]);
  });

  it('discounts // line comments from the source-line count', () => {
    const decorator = '@Component({ selector: "x", template: "" })';
    const body =
      '  // commentary\n  // more\n  a = 1;\n  // mid-comment\n  b = 2;';
    const code = `${decorator}\nexport class X {\n${body}\n}`;
    const messages = lint(code, { threshold: 2 });
    expect(messages).toEqual([]);
  });

  it('discounts JSDoc block-comment lines from the source-line count', () => {
    const decorator = '@Component({ selector: "x", template: "" })';
    const body =
      '  /**\n   * Documentation block.\n   * Continuing description.\n   */\n  a = 1;\n  b = 2;';
    const code = `${decorator}\nexport class X {\n${body}\n}`;
    const messages = lint(code, { threshold: 2 });
    expect(messages).toEqual([]);
  });

  it('uses default threshold 150 when no options provided', () => {
    const code = classWithBody('@Component({ selector: "x", template: "" })', 100);
    const messages = lint(code);
    expect(messages).toEqual([]);
  });

  it('errors with default threshold 150 when class body has 151 source lines', () => {
    const code = classWithBody('@Component({ selector: "x", template: "" })', 151);
    const messages = lint(code);
    expect(messages.length).toBe(1);
    expect(messages[0].message).toContain('151 source lines');
    expect(messages[0].message).toContain('threshold is 150');
  });
});
