import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const rule = require('../config-field-reader-guard.js');

// Each test gets a fresh fixture root because the rule caches the file
// corpus per root path for the lifetime of the lint process.
let root;
let src;

beforeEach(() => {
  // realpath: macOS tmpdir is a symlink, and eslint matches files against
  // the resolved base path
  root = realpathSync(mkdtempSync(join(tmpdir(), 'cfg-reader-guard-')));
  src = join(root, 'projects');
  mkdirSync(src, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeSibling(name, content) {
  writeFileSync(join(src, name), content);
}

function lint(code, options = {}) {
  const declaringFile = join(src, 'the-config.ts');
  // The declaring file must exist in the corpus too, so the rule's
  // own-file exclusion path is exercised.
  writeFileSync(declaringFile, code);
  const linter = new Linter({ cwd: root });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
        },
        plugins: {
          local: { rules: { 'config-field-reader-guard': rule } },
        },
        rules: {
          'local/config-field-reader-guard': ['error', { srcRoots: [src], ...options }],
        },
      },
    ],
    { filename: declaringFile },
  );
}

const CONFIG = `
export interface CngxWidgetConfig {
  readonly closeLabel?: string;
  readonly retryLabel?: string;
}
`;

describe('local/config-field-reader-guard', () => {
  it('passes when every field has a member-access reader in a sibling file', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel; const b = cfg?.retryLabel;');
    expect(lint(CONFIG)).toEqual([]);
  });

  it('reports a field with no reader anywhere', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    const messages = lint(CONFIG);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'CngxWidgetConfig.retryLabel'");
  });

  it('ignores readers in spec files', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('widget.spec.ts', 'expect(cfg.retryLabel).toBe("Retry");');
    const messages = lint(CONFIG);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('retryLabel');
  });

  it('does not count an object-literal key as a reader', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('defaults.ts', 'export const DEFAULTS = { retryLabel: "Retry" };');
    const messages = lint(CONFIG);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('retryLabel');
  });

  it('counts a read inside an inline template string', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('comp.ts', 'const template = `<span>{{ config().retryLabel }}</span>`;');
    expect(lint(CONFIG)).toEqual([]);
  });

  it('does not count a JSDoc {@link} reference as a reader', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('docs.ts', '/** See {@link CngxWidgetConfig.retryLabel}. */\nexport const x = 1;');
    const messages = lint(CONFIG);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('retryLabel');
  });

  it('keeps a comment-start sequence inside a string from eating a reader', () => {
    writeSibling('widget.ts', 'const url = "https://example.com"; const a = cfg.closeLabel; const b = cfg.retryLabel;');
    expect(lint(CONFIG)).toEqual([]);
  });

  it('counts bracket access as a reader', () => {
    writeSibling('widget.ts', "const a = cfg.closeLabel; const b = cfg['retryLabel'];");
    expect(lint(CONFIG)).toEqual([]);
  });

  it('does not count a read inside a with*/provide*/define* plumbing function', () => {
    const code = `
export interface CngxWidgetConfig {
  readonly closeLabel?: string;
}
export function withCloseLabel(cfg: CngxWidgetConfig) {
  return { ...cfg, closeLabel: cfg.closeLabel };
}
`;
    const messages = lint(code);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('closeLabel');
  });

  it('counts a genuine read in the declaring file itself', () => {
    const code = `
export interface CngxWidgetConfig {
  readonly closeLabel?: string;
}
export class CngxWidgetRef {
  close(config: CngxWidgetConfig) {
    if (config.closeLabel) {
      return config.closeLabel;
    }
    return 'Close';
  }
}
`;
    expect(lint(code)).toEqual([]);
  });

  it('counts a read in a sibling external .html template', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('widget.html', '<span [attr.aria-label]="config().retryLabel"></span>');
    expect(lint(CONFIG)).toEqual([]);
  });

  it('does not count an occurrence inside an HTML comment', () => {
    writeSibling('widget.ts', 'const a = cfg.closeLabel;');
    writeSibling('widget.html', '<!-- shows config().retryLabel when set -->');
    const messages = lint(CONFIG);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('retryLabel');
  });

  it('skips interfaces whose name does not match the pattern', () => {
    const code = 'export interface CngxWidgetState { readonly ghost?: string; }';
    expect(lint(code)).toEqual([]);
  });

  it('skips non-exported interfaces', () => {
    const code = 'interface CngxWidgetConfig { readonly ghost?: string; }';
    expect(lint(code)).toEqual([]);
  });

  it('skips fields whose JSDoc carries @deprecated', () => {
    const code = `
export interface CngxWidgetConfig {
  /** @deprecated Superseded by statusLabels.done. Kept one release. */
  readonly closeLabel?: string;
}
`;
    expect(lint(code)).toEqual([]);
  });

  it('does not treat a line comment mentioning @deprecated as a deprecation', () => {
    const code = `
export interface CngxWidgetConfig {
  // @deprecated
  readonly closeLabel?: string;
}
`;
    const messages = lint(code);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('closeLabel');
  });

  it('honours the ignore option per field and per interface', () => {
    const perField = lint(CONFIG, { ignore: ['CngxWidgetConfig.retryLabel', 'CngxWidgetConfig.closeLabel'] });
    expect(perField).toEqual([]);
    const wholeIface = lint(CONFIG, { ignore: ['CngxWidgetConfig.*'] });
    expect(wholeIface).toEqual([]);
  });

  it('supports a custom interface pattern', () => {
    const code = 'export interface WidgetOptions { readonly ghost?: string; }';
    const messages = lint(code, { interfacePattern: 'Options$' });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'WidgetOptions.ghost'");
  });
});
