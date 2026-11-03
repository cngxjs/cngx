import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard for the retired tone-text mix.
 *
 * `--cngx-color-primary-text` and `--cngx-color-danger-text` used to be
 * `color-mix(in oklab, <tone> 70% / 75%, var(--cngx-color-text))`, and reader
 * stylesheets copied that formula into their `var()` fallbacks. The rungs now
 * derive from their tone with relative colour syntax
 * (`oklch(from var(--cngx-color-<tone>) <L> c h)`), so a surviving copy paints
 * a different colour than the core rung it stands in for. One formula per
 * rung: the guard fails on any mix whose first stop is the primary or danger
 * tone at 70% or 75%, single- or multi-line, with or without a nested
 * fallback. The allowlist is empty on purpose.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');

// --- helpers ---------------------------------------------------------------

function walkStyles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkStyles(full));
    } else if (/\.(css|scss)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Blanks comments but keeps every offset and newline, so a hit maps back to
// its line in the original source.
function stripComments(source) {
  const blank = (text) => text.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])(\/\/[^\n]*)/g, (_, lead, comment) => lead + blank(comment));
}

/** Index of the `)` that closes the `(` at `open`, or -1. */
function closingParen(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '(') {
      depth++;
    } else if (source[i] === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

const MIX_HEAD = /^color-mix\(\s*in oklab\s*,\s*var\(--cngx-color-(primary|danger)\b/;

/**
 * Lines (1-based) of every retired tone mix in `source`: a `color-mix` in
 * oklab whose first stop is `var(--cngx-color-primary|danger ...)` at 70% or
 * 75%. The first stop is read to its balanced closing parenthesis, so a
 * nested `var(--x, oklch(...))` fallback does not end the match early.
 */
export function findRetiredMixes(source) {
  const code = stripComments(source);
  const lines = [];
  let from = 0;
  for (;;) {
    const at = code.indexOf('color-mix(', from);
    if (at < 0) {
      return lines;
    }
    from = at + 1;
    const end = closingParen(code, at + 'color-mix'.length);
    if (end < 0) {
      continue;
    }
    const body = code.slice(at, end + 1).replace(/\s+/g, ' ');
    if (!MIX_HEAD.test(body)) {
      continue;
    }
    const varOpen = body.indexOf('var(');
    const varClose = closingParen(body, varOpen + 'var'.length);
    const stop = body.slice(varClose + 1).match(/^\s*(\d+(?:\.\d+)?)%/);
    if (stop && (stop[1] === '70' || stop[1] === '75')) {
      lines.push(code.slice(0, at).split('\n').length);
    }
  }
}

// --- fixtures --------------------------------------------------------------

describe('findRetiredMixes', () => {
  it.each([
    [
      'the one-line core form',
      ':root { --cngx-color-primary-text: color-mix(in oklab, var(--cngx-color-primary) 70%, var(--cngx-color-text)); }',
    ],
    [
      'the multi-line form with a nested fallback',
      [
        '.x {',
        '  color: var(',
        '    --cngx-color-danger-text,',
        '    color-mix(',
        '      in oklab,',
        '      var(--cngx-color-danger, oklch(0.6 0.18 25)) 75%,',
        '      var(--cngx-color-text, oklch(0.2 0.01 250))',
        '    )',
        '  );',
        '}',
      ].join('\n'),
    ],
    [
      'the custom-property form',
      [
        ':root {',
        '  --cngx-mat-tab-error-color: color-mix(',
        '    in oklab,',
        '    var(--cngx-color-danger, oklch(0.6 0.18 25)) 75%,',
        '    var(--cngx-color-text, oklch(0.2 0.01 250))',
        '  );',
        '}',
      ].join('\n'),
    ],
  ])('flags %s', (_, source) => {
    expect(findRetiredMixes(source)).toHaveLength(1);
  });

  it('maps a multi-line hit to the line the mix starts on', () => {
    const source = ['.x {', '  color: color-mix(', '    in oklab,', '    var(--cngx-color-danger) 75%,', '    black', '  );', '}'].join('\n');
    expect(findRetiredMixes(source)).toEqual([2]);
  });

  it.each([
    ['the relative-colour derivation', '.x { color: oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.46 c h); }'],
    ['a 70% mix of an unrelated token', '.x { color: color-mix(in oklab, var(--cngx-color-warning) 70%, var(--cngx-color-text)); }'],
    ['the retired formula inside a comment', '/* color-mix(in oklab, var(--cngx-color-primary) 70%, var(--cngx-color-text)) */ .x { color: red; }'],
  ])('leaves %s alone', (_, source) => {
    expect(findRetiredMixes(source)).toEqual([]);
  });
});

// --- repo scan -------------------------------------------------------------

describe('tone-rung mix guard', () => {
  it('finds no inline copy of the retired 70% / 75% tone mix under projects/', () => {
    const hits = [];
    for (const file of walkStyles(PROJECTS)) {
      for (const line of findRetiredMixes(readFileSync(file, 'utf8'))) {
        hits.push(`${relative(REPO_ROOT, file)}:${line}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
