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
 * signature, never by line number - line anchors rot on the next edit:
 *
 *   (a) `left|right: 50%` centering values. `50%` is symmetric; the logical
 *       twin resolves identically and only adds noise (usually paired with a
 *       `translateX(-50%)` centering transform).
 *   (b) any directional prop inside a rule whose selector contains
 *       `.cngx-popover-panel__arrow`. The CSS-triangle arrow points at its
 *       anchor per the computed placement chosen by the positioning engine -
 *       geometry, not writing direction. Flipping it would break the arrow.
 *   (c) any hit inside a `/ * ... * /` (or scss `//`) comment - prose, not a
 *       live rule. Comments are stripped before detection.
 *   (d) any directional prop inside a rule whose selector contains `spinner`.
 *       A busy-spinner is a rotating ring whose painted quadrant is selected by
 *       `border-<side>-color` and animated 360deg; which physical side carries
 *       the colour is animation geometry, not a reading axis (same class as the
 *       arrow triangle in (b)).
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

/** char-index ranges inside a block whose selector marks placement-driven
 * arrow geometry (b) or spinner-ring geometry (d). Brace-matched; nested
 * blocks inherit the gate. */
const GEOMETRY_SELECTOR = /\.cngx-popover-panel__arrow|spinner/;

function geometryGatedRanges(css) {
  const ranges = [];
  const stack = [];
  let lastBoundary = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const prelude = css.slice(lastBoundary, i);
      const parentGated = stack.length ? stack[stack.length - 1].gated : false;
      const gated = parentGated || GEOMETRY_SELECTOR.test(prelude);
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

const BARE_INSET = /(?<![-\w])(left|right)\s*:\s*([^;{}]+)[;}]/g;
const MARGIN_PADDING_BORDER_INSET = /\b(?:margin|padding|border|inset)-(?:left|right)(?:-[a-z]+)?\b/g;
const PHYSICAL_CORNER_RADIUS = /\bborder-(?:top|bottom)-(?:left|right)-radius\b/g;
const TEXT_ALIGN_FLOAT = /\b(?:text-align|float)\s*:\s*(?:left|right)\b/g;

/** Directional physical properties in `rawCss`, minus the allowlisted stays. */
function findOffenders(rawCss, rel = 'fixture') {
  const css = stripComments(rawCss);
  const gated = geometryGatedRanges(css);
  const inGate = (idx) => gated.some(([s, e]) => idx >= s && idx < e);
  const offenders = [];

  let m;
  BARE_INSET.lastIndex = 0;
  while ((m = BARE_INSET.exec(css)) !== null) {
    const value = m[2].trim();
    if (/^50%/.test(value)) {
      continue; // (a) centering
    }
    if (inGate(m.index)) {
      continue; // (b) / (d) geometry
    }
    offenders.push(`${rel}: ${m[1]}: ${value.slice(0, 40)}`);
  }

  for (const re of [MARGIN_PADDING_BORDER_INSET, PHYSICAL_CORNER_RADIUS, TEXT_ALIGN_FLOAT]) {
    re.lastIndex = 0;
    while ((m = re.exec(css)) !== null) {
      if (inGate(m.index)) {
        continue;
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
        `(.cngx-popover-panel__arrow / *spinner*):\n${offenders.join('\n')}`,
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

    // allowlist (a) centering
    expect(findOffenders('.x { left: 50%; transform: translateX(-50%); }')).toEqual([]);
    // allowlist (b) arrow geometry
    expect(
      findOffenders(".p[data-arrow-placement='top'] > .cngx-popover-panel__arrow { border-left: none; left: calc(-8px); }"),
    ).toEqual([]);
    // allowlist (d) spinner-ring geometry
    expect(findOffenders('.cngx-tabs__busy-spinner { border-right-color: red; }')).toEqual([]);
    // allowlist (c) comments are inert
    expect(findOffenders('/* adds a border-left stripe */ .x { color: red; }')).toEqual([]);
    expect(findOffenders('.x { color: red; } // border-left note\n')).toEqual([]);
  });
});
