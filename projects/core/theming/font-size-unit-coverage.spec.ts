import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the rem-only font-size discipline. Text size is the third
// environment-derived axis after density and the touch-target floor, but it does
// NOT fit the `[data-*]` + SET-from-scale mould: the correct mechanism is a unit
// discipline. Every `font-size` in shipped lib CSS must be root-relative
// (`rem` / `em` / `%`) so the browser user-font-size setting and page zoom scale
// all text for free (WCAG 1.4.4 Resize Text to 200%, 1.4.10 Reflow). A single
// `px` `font-size` literal silently opts that node out - the density /
// touch-target failure mode, transposed onto typography. Nothing in the type
// system prevents the regression; this scan is the force, and it is the
// precondition for the future global `[data-text-size]` S/M/L switch (a strict
// rem baseline lets that switch ride one root-font-size multiplier).
//
// Three scans over every shipped `projects/**/*.css`:
//   (a) every `font-size:` declaration value, and
//   (b) every `--*font-size*`-named custom-property DEFINITION, closing the hole
//       where a `--x-font-size: 14px` token is consumed via `var()` in a
//       `font-size`, and
//   (c) VAR-CHAIN resolution: for every `font-size` value, follow its
//       `var(--token)` references (transitively) to the token's definitions -
//       plain declarations AND `@property { initial-value: ... }` - and fail when
//       a font-size-feeding token is px-ONLY (a nonzero-px definition with no
//       relative-unit definition anywhere in its chain). Scan (c) catches the
//       registered-`<length>`-`initial-value: px` trap that (a)/(b) miss: a
//       registered `@property` always supplies its px initial-value, so the
//       `var(..., 1rem)` fallback never fires and the text is pinned regardless
//       of what name the token carries (`--*-glyph-size`, `--*-font-size`, ...).
// Any captured value carrying a nonzero `px` fails. `font-size: 0` / `0px` resets
// carry no scalable text and pass by construction.
//
// Residual limitation: scan (c) exempts a token that has BOTH a px and a
// relative-unit definition (a scaling override may exist elsewhere in the
// cascade), so a token pinned to px under only one selector is out of static
// reach and stays a manifest-review responsibility - the same class of caveat
// `touch-target-coverage.spec.ts` documents.
//
// Deliberate deviation from the touch-target guard: demo scaffolds under
// `/examples/` are skipped WHOLESALE rather than enrolled per-file, because they
// are not shipped component CSS and their font-size units never gate the axis.
//
// Adding a genuine exception: put the file in EXCLUDED_FONT_SIZE_FILES with a
// one-clause reason. Do not delete a failing assertion - convert the offending
// `px` to `rem`/`em`/`%`, or exclude with a reason.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

// Strip `/* */` comments so the value scan never reads px mentioned in prose
// (a doc comment may legitimately say "12px-era" while the real declaration is
// `em`). Replaced with a space so line numbers stay stable for offender reports.
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

// Recursively collect every shipped `.css` under a repo-relative directory.
// `/examples/` demo scaffolds are skipped wholesale (not shipped component CSS).
const walkCss = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (rel.includes('/examples/')) {
      continue;
    }
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      out.push(...walkCss(rel));
    } else if (entry.endsWith('.css')) {
      out.push(rel);
    }
  }
  return out;
};

const SHIPPED_CSS = walkCss('projects');

// Genuine per-file exceptions, each with a one-clause reason. Empty at ship.
const EXCLUDED_FONT_SIZE_FILES: ReadonlyArray<{ file: string; note: string }> = [];

// (a) `font-size:` declaration values (also matches `--*-font-size:` token defs
//     whose name ends exactly in `font-size`, harmless overlap with scan b).
const FONT_SIZE_VALUE = /font-size\s*:\s*([^;}]+)/g;
// (b) `--*font-size*`-named custom-property definitions.
const FONT_SIZE_TOKEN = /--[a-z-]*font-size[a-z-]*\s*:\s*([^;}]+)/g;
// A `px` length with a NON-ZERO value anywhere in the captured value. A zero px
// (`0px`) carries no scalable text and is allowed, mirroring the `font-size: 0`
// reset allowance - so `font-size: 0px` passes, `font-size: 1px` fails.
const PX_NUMBER = /(\d*\.?\d+)\s*px/g;
const hasNonZeroPx = (value: string): boolean => {
  PX_NUMBER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PX_NUMBER.exec(value)) !== null) {
    if (parseFloat(match[1]) !== 0) {
      return true;
    }
  }
  return false;
};

const lineOf = (css: string, index: number): number => css.slice(0, index).split('\n').length;

interface Offender {
  file: string;
  line: number;
  value: string;
}

const scanValues = (file: string, css: string, re: RegExp): Offender[] => {
  const offenders: Offender[] = [];
  re.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const value = match[1].trim();
    if (hasNonZeroPx(value)) {
      offenders.push({ file, line: lineOf(css, match.index), value });
    }
  }
  return offenders;
};

const collectOffenders = (files: readonly string[]): Offender[] => {
  const offenders: Offender[] = [];
  for (const file of files) {
    const css = stripComments(readRepoCss(file));
    offenders.push(...scanValues(file, css, FONT_SIZE_VALUE), ...scanValues(file, css, FONT_SIZE_TOKEN));
  }
  // A `--*-font-size` token definition is matched by BOTH regexes (its name ends
  // in `font-size`, so the value scan sees it too). Dedupe to one row per
  // physical declaration. Keyed on `file:line -> value` deliberately: the two
  // hits for one token def sit on the same line with the same value, so this key
  // collapses them; keying on match offset instead would stop collapsing them.
  // Two genuinely distinct offenders sharing one line AND value (not possible in
  // one-declaration-per-line CSS) would also collapse - an accepted trade-off.
  const seen = new Set<string>();
  return offenders.filter((o) => {
    const key = `${o.file}:${o.line} -> ${o.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

describe('font-size unit coverage (source scan)', () => {
  const excluded = new Set(EXCLUDED_FONT_SIZE_FILES.map((e) => e.file));
  const scanned = SHIPPED_CSS.filter((file) => !excluded.has(file));

  it('ships no px font-size literal in projects/**/*.css', () => {
    const offenders = collectOffenders(scanned);
    const report = offenders.map((o) => `${o.file}:${o.line} -> ${o.value}`);
    expect(
      report,
      `px font-size literal(s) in shipped lib CSS. Convert to rem/em/% so text ` +
        `scales with user-font-size + zoom (WCAG 1.4.4/1.4.10), or exclude the ` +
        `file in EXCLUDED_FONT_SIZE_FILES with a one-clause reason.`,
    ).toEqual([]);
  });

  it('lists no stale exclusion (every excluded file is a real offender)', () => {
    // Every EXCLUDED_FONT_SIZE_FILES entry must actually carry a px font-size the
    // full scan would flag - otherwise the exclusion is dead weight. (Vacuous
    // while the list is empty; has teeth the moment an entry is added.) The
    // scanned pass already drops excluded files, so a reported-vs-excluded check
    // would be tautological; this stale check is the one with real force.
    const offenderFiles = new Set(collectOffenders(SHIPPED_CSS).map((o) => o.file));
    const stale = [...excluded].filter((file) => !offenderFiles.has(file));
    expect(
      stale,
      `stale EXCLUDED_FONT_SIZE_FILES entries (no px font-size to exclude): ${stale.join(', ')}`,
    ).toEqual([]);
  });
});

// ---- Scan (c): var-chain resolution from font-size into token definitions ----

// Every custom-property definition across shipped CSS: a plain `--token: value`
// declaration OR an `@property --token { initial-value: value }`. One token can
// carry several definitions (host SET + `:root` default + skin/density overrides).
const collectDefs = (files: readonly string[]): Map<string, string[]> => {
  const defs = new Map<string, string[]>();
  const add = (name: string, value: string): void => {
    const list = defs.get(name) ?? [];
    list.push(value.trim());
    defs.set(name, list);
  };
  for (const file of files) {
    const css = stripComments(readRepoCss(file));
    let match: RegExpExecArray | null;
    // Plain `--token: value` declarations. The `@property --token {` header has no
    // colon after the name, so it is not caught here; `initial-value` is scanned
    // separately below.
    const decl = /(--[a-z0-9-]+)\s*:\s*([^;{}]+)/gi;
    while ((match = decl.exec(css)) !== null) {
      add(match[1], match[2]);
    }
    const prop = /@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/gi;
    while ((match = prop.exec(css)) !== null) {
      const initial = /initial-value\s*:\s*([^;}]+)/i.exec(match[2]);
      if (initial) {
        add(match[1], initial[1]);
      }
    }
  }
  return defs;
};

// Custom-property names referenced by a `var()` inside a value.
const varsIn = (value: string): string[] => {
  const out: string[] = [];
  const re = /var\(\s*(--[a-z0-9-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    out.push(match[1]);
  }
  return out;
};

// A value carries a root-relative length (so it scales). `var()` refs are NOT
// treated as relative here - they are followed transitively instead.
const RELATIVE_UNIT = /\d\s*(rem|em|%|vh|vw|vmin|vmax|vi|vb|ch|ex|lh|rlh)\b/i;

// Every definition value reachable from a token, following `var()` refs
// transitively (cycle-guarded).
const chainValues = (token: string, defs: Map<string, string[]>, seen = new Set<string>()): string[] => {
  if (seen.has(token)) {
    return [];
  }
  seen.add(token);
  const values: string[] = [];
  for (const value of defs.get(token) ?? []) {
    values.push(value);
    for (const child of varsIn(value)) {
      values.push(...chainValues(child, defs, seen));
    }
  }
  return values;
};

describe('font-size unit coverage (var-chain resolution)', () => {
  const defs = collectDefs(SHIPPED_CSS);
  const excluded = new Set(EXCLUDED_FONT_SIZE_FILES.map((e) => e.file));

  it('no font-size reads a px-only token (registered <length> initial-value trap)', () => {
    const offenders: string[] = [];
    for (const file of SHIPPED_CSS) {
      if (excluded.has(file)) {
        continue;
      }
      const css = stripComments(readRepoCss(file));
      const fontSize = /font-size\s*:\s*([^;}]+)/gi;
      let match: RegExpExecArray | null;
      while ((match = fontSize.exec(css)) !== null) {
        const line = lineOf(css, match.index);
        for (const token of varsIn(match[1])) {
          const chain = chainValues(token, defs);
          const pinnedPx = chain.some(hasNonZeroPx) && !chain.some((value) => RELATIVE_UNIT.test(value));
          if (pinnedPx) {
            const pxDef = chain.find(hasNonZeroPx) ?? '';
            offenders.push(`${file}:${line} font-size reads ${token} = "${pxDef}" (px-only)`);
          }
        }
      }
    }
    const report = [...new Set(offenders)];
    expect(
      report,
      `font-size(s) read a px-ONLY token, so the text is pinned and cannot scale ` +
        `(WCAG 1.4.4/1.4.10). A registered @property <length> always supplies its ` +
        `px initial-value, defeating the var() rem fallback - unregister the token ` +
        `or give it a rem/em/% definition.`,
    ).toEqual([]);
  });
});
