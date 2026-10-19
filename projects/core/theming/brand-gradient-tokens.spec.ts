import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { compileThemeEntry } from '@cngx/testing/sass';

// Source-CSS contract for the opt-in brand rungs `--cngx-color-accent` and
// `--cngx-gradient-brand`. Both derive from `--cngx-color-primary` through
// var(), which resolves where the declaration sits, so they travel with every
// block that sets primary. No library stylesheet may read them: the default
// theme stays browser-native and the rungs exist for consumer surfaces.

// The runner cwd is the repo root; `__dirname` points into a hoisted chunk.
const REPO_ROOT = process.cwd();
const PROJECTS = resolve(REPO_ROOT, 'projects');
const SYSTEM_TOKENS = 'core/theming/system-tokens.css';
const SYSTEM_BRIDGE = 'themes/material/system-bridge.scss';

const css = readFileSync(join(PROJECTS, SYSTEM_TOKENS), 'utf-8');

const ACCENT = '--cngx-color-accent: oklch(from var(--cngx-color-primary) l c calc(h - 70));';
const GRADIENT =
  '--cngx-gradient-brand: linear-gradient(100deg, var(--cngx-color-primary), var(--cngx-color-accent));';

function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
}

/** Every innermost `{...}` rule body of `source` that assigns `--cngx-color-primary`. */
function primaryBlocks(source: string): readonly string[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...withoutComments.matchAll(/{([^{}]*)}/g)]
    .map((m) => normalise(m[1]))
    .filter((body) => /--cngx-color-primary\s*:/.test(body));
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      return [];
    }
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe('brand rungs in system-tokens.css', () => {
  it.each(['--cngx-color-accent', '--cngx-gradient-brand'])(
    '%s is not registered, so the derivation from primary always applies',
    (token) => {
      expect(css).not.toMatch(new RegExp(`@property ${token}\\b`));
    },
  );

  it('derives both rungs in every block that sets primary', () => {
    const blocks = primaryBlocks(css);
    // light root, OS dark, explicit dark, explicit light
    expect(blocks).toHaveLength(4);
    for (const block of blocks) {
      expect(block).toContain(ACCENT);
      expect(block).toContain(GRADIENT);
    }
  });
});

describe('brand rungs in the Material system bridge', () => {
  function compile(theme: string): readonly string[] {
    return primaryBlocks(
      compileThemeEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;

html {
  @include cngx-system.theme(${theme});
}
`),
    );
  }

  it.each([
    ['M3', 'mat.define-theme()'],
    [
      'M2',
      'mat.m2-define-light-theme((color: (primary: mat.m2-define-palette(mat.$m2-indigo-palette), accent: mat.m2-define-palette(mat.$m2-pink-palette))))',
    ],
  ])('re-derives both rungs from the bridged primary under %s', (_, theme) => {
    const blocks = compile(theme);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain(ACCENT);
    expect(blocks[0]).toContain(GRADIENT);
  });
});

describe('browser-native default', () => {
  const READ = /--cngx-color-accent(?![\w-])|--cngx-gradient-brand(?![\w-])/;
  const DECLARING = new Set([SYSTEM_TOKENS, SYSTEM_BRIDGE]);

  it('no library stylesheet or component reads the brand rungs', () => {
    const readers = walk(PROJECTS)
      .filter((path) => /\.(css|scss|ts)$/.test(path) && !/\.spec\.ts$/.test(path))
      .map((path) => relative(PROJECTS, path))
      .filter((path) => !DECLARING.has(path))
      .filter((path) => READ.test(readFileSync(join(PROJECTS, path), 'utf-8')));
    expect(readers).toEqual([]);
  });

  // The accent is the gradient's second stop, not a second signal colour:
  // demo state styling (focus rings, progress, flashes) stays on primary.
  it('the demo stylesheet never reads the accent on its own', () => {
    const demoStyles = readFileSync(resolve(REPO_ROOT, 'examples/src/styles.scss'), 'utf-8');
    expect(demoStyles).not.toMatch(/--cngx-color-accent(?![\w-])/);
  });
});
