import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard for the four tone rungs' reader fallbacks.
 *
 * `--cngx-color-primary-text` and `--cngx-color-danger-text` used to be
 * `color-mix(in oklab, <tone> 70% / 75%, var(--cngx-color-text))`, and reader
 * stylesheets copied that formula into their `var()` fallbacks. The rungs now
 * derive from their tone with relative colour syntax
 * (`oklch(from var(--cngx-color-<tone>) <L> c h)`), so a surviving copy paints
 * a different colour than the core rung it stands in for. One formula per
 * rung: the guard fails on any mix whose first stop is the primary or danger
 * tone at 70% or 75%, single- or multi-line, with or without a nested
 * fallback.
 *
 * Every reader that falls back for a rung (`var(--cngx-color-<tone>-<rung>,
 * <fallback>)`) must also use the one derivation form, so the fallback paints
 * the colour the core rung would: `oklch(from var(--cngx-color-<tone>,
 * <tone literal>) <L> c h)`, where the tone literal and L are the values one
 * scheme block of `system-tokens.css` declares. A literal fallback ignores a
 * brand primary, and a hand-copied lightness drifts the next time core moves
 * it. The tone literal names the scheme: the light literal pairs with the
 * light L, the dark literal with the dark L.
 *
 * A registered property whose assignment reads a rung directly keeps the
 * rung's light value as its `initial-value` (the registration convention:
 * the initial is the light default as a literal), so the registration
 * documents the colour the reader actually paints. All allowlists are empty
 * on purpose.
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

const TOKENS = resolve(PROJECTS, 'core', 'theming', 'system-tokens.css');
const RUNG_READER = /^var\(\s*--cngx-color-(primary|danger)-(text|strong)\s*,/;

/** The scheme blocks of system-tokens.css, as tone literal + rung lightness. */
export function readSchemes(tokens) {
  const block = (pattern) => {
    const match = tokens.match(pattern);
    if (!match) {
      throw new Error(`system-tokens.css: ${pattern} not found`);
    }
    return match[0];
  };
  const read = (body) => {
    const scheme = {};
    for (const tone of ['primary', 'danger']) {
      const literal = body.match(new RegExp(`--cngx-color-${tone}: (oklch\\([^()]*\\));`));
      scheme[tone] = { literal: literal?.[1] };
      for (const rung of ['text', 'strong']) {
        const derived = body.match(
          new RegExp(
            `--cngx-color-${tone}-${rung}: oklch\\(from var\\(--cngx-color-${tone}\\) ([0-9.]+) c h\\);`,
          ),
        );
        scheme[tone][rung] = derived?.[1];
      }
    }
    return scheme;
  };
  return {
    light: read(block(/\n {2}:root {[^}]+}/)),
    dark: read(block(/\[data-color-scheme='dark'\],\s*\.dark {[^}]+}/)),
  };
}

/**
 * Lines (1-based) of every rung reader in `source` whose fallback is not the
 * derivation of one scheme block in `schemes`, each with the reason.
 */
export function findDriftedFallbacks(source, schemes) {
  const code = stripComments(source);
  const hits = [];
  let from = 0;
  for (;;) {
    const at = code.indexOf('var(', from);
    if (at < 0) {
      return hits;
    }
    from = at + 1;
    const end = closingParen(code, at + 'var'.length);
    if (end < 0) {
      continue;
    }
    const body = code.slice(at, end + 1).replace(/\s+/g, ' ');
    const reader = body.match(RUNG_READER);
    if (!reader) {
      continue;
    }
    const [head, tone, rung] = reader;
    const fallback = body.slice(head.length, -1).trim();
    const derived = fallback.match(
      new RegExp(
        `^oklch\\(from var\\(--cngx-color-${tone}, (oklch\\([^()]*\\))\\) ([0-9.]+) c h\\)$`,
      ),
    );
    const scheme = derived && Object.values(schemes).find((s) => s[tone].literal === derived[1]);
    const ok = scheme && scheme[tone][rung] === derived[2];
    if (!ok) {
      hits.push({
        line: code.slice(0, at).split('\n').length,
        reason: `--cngx-color-${tone}-${rung} falls back to ${fallback}`,
      });
    }
  }
}

const PROPERTY_BLOCK = /@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/gi;

/**
 * Registered properties in `source` that are assigned straight from a rung
 * but whose `initial-value` is not that rung's light value.
 */
export function findStaleInitials(source, schemes) {
  const code = stripComments(source);
  const hits = [];
  PROPERTY_BLOCK.lastIndex = 0;
  let m;
  while ((m = PROPERTY_BLOCK.exec(code)) !== null) {
    const [, name, body] = m;
    const initial = body.match(/initial-value\s*:\s*([^;]+);/)?.[1].trim();
    const assignments = [...code.matchAll(new RegExp(`${name}\\s*:\\s*([^;]{0,80})`, 'g'))].map(
      (a) =>
        a[1].replace(/\s+/g, ' ').match(/^var\( ?--cngx-color-(primary|danger)-(text|strong)\b/),
    );
    const [first] = assignments;
    // Only a property fed by exactly one rung everywhere: a per-tone property
    // (assigned from several rungs) keeps a neutral initial on purpose.
    const single = first && assignments.every((x) => x && x[1] === first[1] && x[2] === first[2]);
    if (!initial || !single) {
      continue;
    }
    const [, tone, rung] = first;
    const light = schemes.light[tone];
    const expected = light.literal.replace(/^oklch\(([0-9.]+)/, `oklch(${light[rung]}`);
    if (initial !== expected) {
      hits.push({
        line: code.slice(0, m.index).split('\n').length,
        reason: `${name} initial-value ${initial}, expected ${expected} (--cngx-color-${tone}-${rung})`,
      });
    }
  }
  return hits;
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
    const source = [
      '.x {',
      '  color: color-mix(',
      '    in oklab,',
      '    var(--cngx-color-danger) 75%,',
      '    black',
      '  );',
      '}',
    ].join('\n');
    expect(findRetiredMixes(source)).toEqual([2]);
  });

  it.each([
    [
      'the relative-colour derivation',
      '.x { color: oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.46 c h); }',
    ],
    [
      'a 70% mix of an unrelated token',
      '.x { color: color-mix(in oklab, var(--cngx-color-warning) 70%, var(--cngx-color-text)); }',
    ],
    [
      'the retired formula inside a comment',
      '/* color-mix(in oklab, var(--cngx-color-primary) 70%, var(--cngx-color-text)) */ .x { color: red; }',
    ],
  ])('leaves %s alone', (_, source) => {
    expect(findRetiredMixes(source)).toEqual([]);
  });
});

const SCHEMES = {
  light: {
    primary: { literal: 'oklch(0.66 0.19 50)', text: '0.54', strong: '0.58' },
    danger: { literal: 'oklch(0.6 0.18 25)', text: '0.46', strong: '0.48' },
  },
  dark: {
    primary: { literal: 'oklch(0.72 0.18 50)', text: '0.8', strong: '0.72' },
    danger: { literal: 'oklch(0.68 0.17 25)', text: '0.74', strong: '0.68' },
  },
};

describe('readSchemes', () => {
  it('reads the tone literals and rung lightness of the light and dark blocks', () => {
    expect(readSchemes(readFileSync(TOKENS, 'utf8'))).toEqual(SCHEMES);
  });
});

describe('findDriftedFallbacks', () => {
  it.each([
    ['a literal fallback', '.x { color: var(--cngx-color-primary-text, oklch(0.54 0.19 50)); }'],
    [
      'a drifted lightness',
      '.x { color: var(--cngx-color-danger-text, oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.48 c h)); }',
    ],
    [
      'a dark lightness on the light tone literal',
      '.x { color: var(--cngx-color-danger-text, oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.74 c h)); }',
    ],
    [
      'a derivation without a tone literal',
      '.x { color: var(--cngx-color-danger-text, oklch(from var(--cngx-color-danger) 0.46 c h)); }',
    ],
    [
      'the strong lightness on the text rung',
      '.x { color: var(--cngx-color-primary-text, oklch(from var(--cngx-color-primary, oklch(0.66 0.19 50)) 0.58 c h)); }',
    ],
  ])('flags %s', (_, source) => {
    expect(findDriftedFallbacks(source, SCHEMES)).toHaveLength(1);
  });

  it.each([
    ['a reader without a fallback', '.x { color: var(--cngx-color-primary-strong); }'],
    [
      'the light derivation over several lines',
      [
        '.x {',
        '  color: var(',
        '    --cngx-color-danger-text,',
        '    oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.46 c h)',
        '  );',
        '}',
      ].join('\n'),
    ],
    [
      'the dark derivation',
      '.x { color: var(--cngx-color-danger-text, oklch(from var(--cngx-color-danger, oklch(0.68 0.17 25)) 0.74 c h)); }',
    ],
    [
      'a nested reader inside a component token',
      '.x { color: var(--x, var(--cngx-color-primary-strong, oklch(from var(--cngx-color-primary, oklch(0.66 0.19 50)) 0.58 c h))); }',
    ],
  ])('leaves %s alone', (_, source) => {
    expect(findDriftedFallbacks(source, SCHEMES)).toEqual([]);
  });
});

describe('findStaleInitials', () => {
  const registered = (initial) =>
    [
      `@property --x-fg { syntax: '<color>'; inherits: true; initial-value: ${initial}; }`,
      ':root {',
      '  --x-fg: var(',
      '    --cngx-color-danger-text,',
      '    oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.46 c h)',
      '  );',
      '}',
    ].join('\n');

  it('flags an initial that is not the light rung value', () => {
    expect(findStaleInitials(registered('oklch(0.55 0.18 25)'), SCHEMES)).toHaveLength(1);
  });

  it('accepts the light rung value', () => {
    expect(findStaleInitials(registered('oklch(0.46 0.18 25)'), SCHEMES)).toEqual([]);
  });

  it('ignores a per-tone property fed by several rungs', () => {
    const source = [
      "@property --t { syntax: '<color>'; inherits: true; initial-value: currentColor; }",
      '.p { --t: var(--cngx-color-primary-text); }',
      '.d { --t: var(--cngx-color-danger-text); }',
    ].join('\n');
    expect(findStaleInitials(source, SCHEMES)).toEqual([]);
  });

  it('ignores a registered property that does not read a rung', () => {
    const source =
      "@property --y { syntax: '<color>'; inherits: true; initial-value: red; } :root { --y: var(--cngx-color-danger); }";
    expect(findStaleInitials(source, SCHEMES)).toEqual([]);
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

  it('finds no rung fallback under projects/ that drifts from system-tokens.css', () => {
    const schemes = readSchemes(readFileSync(TOKENS, 'utf8'));
    const hits = [];
    for (const file of walkStyles(PROJECTS)) {
      if (file === TOKENS) {
        continue;
      }
      for (const { line, reason } of findDriftedFallbacks(readFileSync(file, 'utf8'), schemes)) {
        hits.push(`${relative(REPO_ROOT, file)}:${line} ${reason}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('finds no registered rung reader under projects/ with a stale initial-value', () => {
    const schemes = readSchemes(readFileSync(TOKENS, 'utf8'));
    const hits = [];
    for (const file of walkStyles(PROJECTS)) {
      for (const { line, reason } of findStaleInitials(readFileSync(file, 'utf8'), schemes)) {
        hits.push(`${relative(REPO_ROOT, file)}:${line} ${reason}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
