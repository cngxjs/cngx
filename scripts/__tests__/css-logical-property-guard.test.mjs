import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard that keeps shipped CSS free of directional PHYSICAL
 * properties, so a document under `<html dir="rtl">` lays out along the reading
 * axis instead of being pinned left-to-right. It backs the RTL migration exit
 * criterion: every `left` / `right` / `margin-left` / `border-right` etc. in
 * component CSS is a logical property (`inset-inline-*`, `margin-inline-*`,
 * `border-inline-*`, `text-align: start/end`) unless it is one of the
 * intentional physical stays enumerated below.
 *
 * Scanned: `projects/ ** / *.{css,scss}` minus `/examples/` (not shipped),
 * `/themes/` and `*-theme.scss` (Material bridges resolve to `--mat-sys-*`,
 * not a reading axis), and `*.spec.*`.
 *
 * Flagged as directional-physical:
 *   - `margin|padding|border|inset-(left|right)` (incl. longhands like
 *     `border-left-color`)
 *   - `border-(top|bottom)-(left|right)-radius`
 *   - `text-align: left|right`
 *   - `float: left|right`
 *   - a bare `left:` / `right:` inset declaration
 *
 * Intentional physical STAYS (the allowlist) are matched by SELECTOR or VALUE
 * signature, never by line number - line anchors rot on the next edit. Each
 * stay is scoped as narrowly as its justification:
 *
 *   (a) a bare `left|right: 50%` centering inset, but ONLY when its own rule
 *       block also carries a centering `translate` (`translateX(±50%)` /
 *       `translate: -50% …`). `50%` alone is not proof of centering - it is
 *       proof only when paired with the half-shift transform that recentres the
 *       box; a lone `left: 50%` is a real directional pin and stays flagged.
 *   (b) ANY directional prop inside a rule whose selector contains
 *       `.cngx-popover-panel__arrow`. The CSS-triangle arrow is drawn entirely
 *       from physical border/margin/inset and points at its anchor per the
 *       computed placement chosen by the positioning engine - geometry, not
 *       writing direction. The whole rule is geometry, so the whole rule is
 *       exempt.
 *   (c) any hit inside a `/ * ... * /` (or scss `//`) comment - prose, not a
 *       live rule. Comments are stripped before detection.
 *   (d) ONLY the directional border longhand `border-(left|right)-(color|
 *       width|style)` inside a rule whose selector contains `spinner`. A
 *       busy-spinner is a rotating ring whose painted quadrant is selected by
 *       `border-<side>-color` and animated 360deg; which physical side carries
 *       the colour is animation geometry, not a reading axis. The exemption is
 *       deliberately the colour/width/style longhand only - a real directional
 *       `padding-left` / `text-align: left` inside a spinner-named rule is NOT
 *       geometry and stays flagged.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');

/** Not part of the shipped, direction-sensitive surface. */
function isExcluded(rel) {
  return (
    rel.includes('/examples/') ||
    rel.includes('/themes/') ||
    /-theme\.scss$/.test(rel) ||
    /\.spec\./.test(rel)
  );
}

// --- helpers ---------------------------------------------------------------

function walkStyles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkStyles(full));
    } else if (/\.(css|scss)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Strip `/ * ... * /` blocks and (scss) `//` line comments so allowlist (c)
 * holds. The `//` pass is protocol-safe - it never eats `https://`. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** char-index ranges inside a block whose selector matches `markerRe`.
 * Brace-matched; nested blocks inherit the gate. */
function gatedRanges(css, markerRe) {
  const ranges = [];
  const stack = [];
  let lastBoundary = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const prelude = css.slice(lastBoundary, i);
      const parentGated = stack.length ? stack[stack.length - 1].gated : false;
      const gated = parentGated || markerRe.test(prelude);
      stack.push({ gated, start: i + 1 });
      lastBoundary = i + 1;
    } else if (ch === '}') {
      const top = stack.pop();
      if (top && top.gated) {
        ranges.push([top.start, i]);
      }
      lastBoundary = i + 1;
    }
  }
  return ranges;
}

/** The innermost `{ … }` block body enclosing `idx`. */
function enclosingBlock(css, idx) {
  let depth = 0;
  let start = 0;
  for (let i = idx; i >= 0; i--) {
    if (css[i] === '}') {
      depth++;
    } else if (css[i] === '{') {
      if (depth === 0) {
        start = i + 1;
        break;
      }
      depth--;
    }
  }
  depth = 0;
  let end = css.length;
  for (let i = idx; i < css.length; i++) {
    if (css[i] === '{') {
      depth++;
    } else if (css[i] === '}') {
      if (depth === 0) {
        end = i;
        break;
      }
      depth--;
    }
  }
  return css.slice(start, end);
}

/** An X-axis centering half-shift recentres a horizontally `50%`-pinned box:
 * `translateX(±50%)`, `translate(±50%, …)` (first arg is X), or the standalone
 * `translate: ±50% …` property (first value is X). A `translateY(±50%)` or a
 * `translate(0, ±50%)` shifts only the block axis and does NOT recentre a
 * `left`/`right: 50%`, so it does not qualify. */
function hasCenteringTranslate(block) {
  return /(?:translatex\(|\btranslate\(|\btranslate:)\s*-?50%/i.test(block);
}

const ARROW_SELECTOR = /\.cngx-popover-panel__arrow/;
const SPINNER_SELECTOR = /spinner/;
const SPINNER_BORDER_LONGHAND = /^border-(?:left|right)-(?:color|width|style)$/;

const BARE_INSET = /(?<![-\w])(left|right)\s*:\s*([^;{}]+)[;}]/g;
const MARGIN_PADDING_BORDER_INSET = /\b(?:margin|padding|border|inset)-(?:left|right)(?:-[a-z]+)?\b/g;
const PHYSICAL_CORNER_RADIUS = /\bborder-(?:top|bottom)-(?:left|right)-radius\b/g;
const TEXT_ALIGN_FLOAT = /\b(?:text-align|float)\s*:\s*(?:left|right)\b/g;

/** Directional physical properties in `rawCss`, minus the allowlisted stays. */
function findOffenders(rawCss, rel = 'fixture') {
  const css = stripComments(rawCss);
  const arrow = gatedRanges(css, ARROW_SELECTOR);
  const spinner = gatedRanges(css, SPINNER_SELECTOR);
  const inArrow = (idx) => arrow.some(([s, e]) => idx >= s && idx < e);
  const inSpinner = (idx) => spinner.some(([s, e]) => idx >= s && idx < e);
  const offenders = [];

  let m;
  BARE_INSET.lastIndex = 0;
  while ((m = BARE_INSET.exec(css)) !== null) {
    if (inArrow(m.index)) {
      continue; // (b) arrow geometry
    }
    const value = m[2].trim();
    if (/^50%/.test(value) && hasCenteringTranslate(enclosingBlock(css, m.index))) {
      continue; // (a) centering, transform-verified
    }
    offenders.push(`${rel}: ${m[1]}: ${value.slice(0, 40)}`);
  }

  MARGIN_PADDING_BORDER_INSET.lastIndex = 0;
  while ((m = MARGIN_PADDING_BORDER_INSET.exec(css)) !== null) {
    if (inArrow(m.index)) {
      continue; // (b)
    }
    if (SPINNER_BORDER_LONGHAND.test(m[0]) && inSpinner(m.index)) {
      continue; // (d) spinner ring colour/width/style only
    }
    offenders.push(`${rel}: ${m[0]}`);
  }

  for (const re of [PHYSICAL_CORNER_RADIUS, TEXT_ALIGN_FLOAT]) {
    re.lastIndex = 0;
    while ((m = re.exec(css)) !== null) {
      if (inArrow(m.index)) {
        continue; // (b)
      }
      offenders.push(`${rel}: ${m[0].trim()}`);
    }
  }

  return offenders;
}

// --- the suite -------------------------------------------------------------

const STYLE_FILES = walkStyles(PROJECTS)
  .map((f) => ({ full: f, rel: '/' + relative(REPO_ROOT, f).replaceAll('\\', '/') }))
  .filter(({ rel }) => !isExcluded(rel));

describe('css logical-property (RTL) regression guard', () => {
  it('shipped CSS carries no directional physical property (save the allowlisted geometry/centering stays)', () => {
    const offenders = [];
    for (const { full, rel } of STYLE_FILES) {
      offenders.push(...findOffenders(readFileSync(full, 'utf8'), rel));
    }
    expect(
      offenders,
      `these declarations are directional PHYSICAL properties - convert to the logical twin ` +
        `(inset-inline-*, margin-inline-*, border-inline-*, text-align: start/end), or, if the ` +
        `side is placement/animation geometry, move the rule under an allowlisted selector ` +
        `(.cngx-popover-panel__arrow / *spinner* border-color):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('detects a reintroduced directional property and honours the allowlist', () => {
    // fails-direction: a physical property must be caught
    expect(findOffenders('.x { border-left: 3px solid red; }')).toHaveLength(1);
    expect(findOffenders('.x { margin-right: 4px; }')).toHaveLength(1);
    expect(findOffenders('.x { text-align: right; }')).toHaveLength(1);
    expect(findOffenders('.x { right: -2px; }')).toHaveLength(1);
    expect(findOffenders('.x { border-top-left-radius: 4px; }')).toHaveLength(1);

    // passes-direction: the logical twins are never flagged
    expect(findOffenders('.x { border-inline-start: 3px solid red; }')).toEqual([]);
    expect(findOffenders('.x { inset-inline-end: -2px; text-align: end; }')).toEqual([]);

    // allowlist (a) centering — ONLY with the paired half-shift transform
    expect(findOffenders('.x { left: 50%; transform: translateX(-50%); }')).toEqual([]);
    expect(findOffenders('.x { left: 50%; translate: -50% 0; }')).toEqual([]);
    // a lone left:50% with no centering transform is a real directional pin
    expect(findOffenders('.x { left: 50%; }')).toHaveLength(1);
    expect(findOffenders('.x { left: 50%; transform: translateY(-50%); }')).toHaveLength(1);

    // allowlist (b) arrow geometry — the whole rule is exempt
    expect(
      findOffenders(".p[data-arrow-placement='top'] > .cngx-popover-panel__arrow { border-left: none; left: calc(-8px); }"),
    ).toEqual([]);

    // allowlist (d) spinner-ring geometry — border-color longhand only
    expect(findOffenders('.cngx-tabs__busy-spinner { border-right-color: red; }')).toEqual([]);
    // but a non-geometry directional prop in a spinner rule is still caught
    expect(findOffenders('.cngx-spinner-label { text-align: left; }')).toHaveLength(1);
    expect(findOffenders('.cngx-spinner-label { padding-left: 8px; }')).toHaveLength(1);

    // allowlist (c) comments are inert
    expect(findOffenders('/* adds a border-left stripe */ .x { color: red; }')).toEqual([]);
    expect(findOffenders('.x { color: red; } // border-left note\n')).toEqual([]);
  });
});
