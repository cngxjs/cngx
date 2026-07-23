import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide static guard for the two CSS invariants the density sweeps rely on.
 *
 * (a) Density derivation (file-coarse): a component stylesheet that references a
 *     spacing token (a custom property named `*-gap` / `*-padding`) MUST SET at
 *     least one token from the `--cngx-space-*` scale at a NON-skin-gated host
 *     in that same file, so a root `[data-density]` swap re-scales it
 *     (pillars.md "Density derivation"). This catches the wave regression - a
 *     new component that ships spacing with zero derivation. `*-inset` tokens
 *     are NOT counted: an inset positions a thumb / rail / indicator
 *     (affordance geometry), which the pillar CSS rule excludes from density -
 *     densifying it would distort the affordance, not compact the component.
 *     It is deliberately coarse (per-file, not per-token): a file with any own
 *     scale SET passes. Split stylesheets (a consumer whose SET lives in a
 *     sibling / shared base / other lib), pure `@property`-declaration files,
 *     and genuine pre-existing gaps live in DENSITY_ALLOWLIST with a one-clause
 *     reason. Skin stylesheets (`*-skins.css`) are skin-gated by design and
 *     never host the default SET, so they are exempt.
 *
 * (b) `@property` validity: a registered typed-dimension token
 *     (`<length>` / `<length-percentage>` / `<angle>` / `<time>` / ...) must
 *     carry a computationally-independent `initial-value` - no relative unit
 *     (`rem` / `em` / `%` / `vw` / ...), no `var()` / `env()`, no CSS-wide
 *     keyword. Any syntax (incl. `*`) must not use a CSS-wide keyword as its
 *     initial-value. A rule that violates this is silently DROPPED by the
 *     browser, taking its `inherits` flag and fallback with it (see
 *     property-invalid-initial-value-findings.md).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const PROJECTS = resolve(REPO_ROOT, 'projects');

/** Not component default hosts: theme bridges + brand examples SET tokens to
 * theme/brand values, not the scale. Excluded from the density check only. */
function isDensityExcluded(relPath) {
  return relPath.includes('/themes/') || /-skins\.css$/.test(relPath);
}

/** Component stylesheets that reference a spacing token but hold no own scale
 * SET. Each entry names where the derivation actually happens (or flags a
 * tracked gap). Keep this principled - it is the escape hatch, not a dumping
 * ground. A NEW component that opts out of density is meant to fail here. */
const DENSITY_ALLOWLIST = new Map([
  [
    '/projects/ui/stepper/stepper.component.css',
    'split stylesheet - the --cngx-step-* SETs live in styles/stepper-base.css.',
  ],
  [
    '/projects/ui/accordion/accordion-item.component.css',
    'split stylesheet - the --cngx-accordion-* SETs live in accordion-group.component.css.',
  ],
  [
    '/projects/ui/data-grid-accordion/data-grid-row.component.css',
    'split stylesheet - the --cngx-dga-* SETs live in data-grid-accordion.component.css.',
  ],
  [
    '/projects/ui/paginator/paginator.component.css',
    'split across libs - the paginate + per-segment SETs all live in common/data/paginate/styles/paginator-base.css; the ui/paginator skin use-sites read the scale directly (density-sweep-wave-5).',
  ],
  [
    '/projects/common/display/tag/tag.css',
    'split stylesheet - the --cngx-tag-* SETs live in shared/tag-base.css.',
  ],
  [
    '/projects/common/display/tag-group/tag-group.component.css',
    'split stylesheet - the --cngx-tag-group-* SETs live in tag/shared/tag-base.css.',
  ],
  [
    '/projects/common/theming/components/cngx-data-grid.css',
    'pure @property declaration file - the --cngx-dga-* SETs live in ui/data-grid-accordion.',
  ],
  [
    '/projects/forms/filter-builder/filter-builder-row.component.css',
    'split stylesheet - the --cngx-filter-builder-gap SET lives in filter-builder.component.css.',
  ],
  [
    '/projects/forms/filter-builder/filter-builder-expression-row.component.css',
    'split stylesheet - the --cngx-filter-builder-gap SET lives in filter-builder.component.css.',
  ],
  [
    '/projects/common/interactive/button-toggle/button-toggle-group.component.css',
    'deliberate 0-keep - --cngx-button-toggle-group-gap defaults to 0 so segmented toggles render flush; deriving it would introduce an unwanted gap.',
  ],
]);

// --- helpers ---------------------------------------------------------------

function walkCss(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkCss(full));
    } else if (entry.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** char-index ranges inside a `[data-skin...]`-gated block (nested blocks
 * inherit the gate). Brace-matched. `:not([data-skin])` is the explicitly
 * UNSKINNED default host and does NOT gate. */
function skinGatedRanges(css) {
  const ranges = [];
  const stack = [];
  let lastBoundary = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const prelude = css.slice(lastBoundary, i).replace(/:not\(\s*\[data-skin[^)]*\)/g, '');
      const parentGated = stack.length ? stack[stack.length - 1].gated : false;
      const gated = parentGated || /\[data-skin/.test(prelude);
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

const SPACING_TOKEN_REF = /--cngx-[a-z0-9-]+/g;
// `-inset` names affordance/position geometry (thumb / rail / indicator offset)
// and is deliberately NOT matched: it is not compactness, per the pillar CSS
// density rule. Naming convention that keeps this correct by construction -
// compactness spacing is named `-gap` / `-padding` / `-margin` (all guarded);
// `-inset` is reserved for affordance. The one margin-inset in the tree
// (`--cngx-divider-inset-amount`) predates the convention and already derives,
// so nothing regresses; a new compactness value must not take the `-inset`
// suffix, and review catches it if it does.
const IS_SPACING = /-(gap|padding)(-|$)/;
const SCALE_SET = /--[a-z][a-z0-9-]*\s*:\s*[^;{}]*var\(\s*--cngx-space-/g;

function referencesSpacingToken(css) {
  SPACING_TOKEN_REF.lastIndex = 0;
  let m;
  while ((m = SPACING_TOKEN_REF.exec(css)) !== null) {
    if (IS_SPACING.test(m[0])) {
      return true;
    }
  }
  return false;
}

function hasNonSkinGatedScaleSet(css) {
  const gated = skinGatedRanges(css);
  SCALE_SET.lastIndex = 0;
  let m;
  while ((m = SCALE_SET.exec(css)) !== null) {
    const inGate = gated.some(([s, e]) => m.index >= s && m.index < e);
    if (!inGate) {
      return true;
    }
  }
  return false;
}

const TYPED_DIMENSION = /^<(length|length-percentage|angle|time|resolution|flex)>$/;
const RELATIVE_UNIT = /(?:\d|\.)\s*(rem|em|ex|ch|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|%)\b/i;
const CSS_WIDE_KEYWORD = /^(inherit|initial|unset|revert|revert-layer)$/i;
const PROPERTY_BLOCK = /@property\s+(--[a-z0-9-]+)\s*\{([\s\S]*?)\}/gi;

function propertyViolations(css, relPath) {
  const violations = [];
  PROPERTY_BLOCK.lastIndex = 0;
  let m;
  while ((m = PROPERTY_BLOCK.exec(css)) !== null) {
    const name = m[1];
    const body = m[2];
    const syntaxMatch = body.match(/syntax:\s*['"]([^'"]*)['"]/);
    const initialMatch = body.match(/initial-value:\s*([^;]+);/);
    if (!initialMatch) {
      continue;
    }
    const syntax = syntaxMatch ? syntaxMatch[1].trim() : '*';
    const initial = initialMatch[1].trim();

    if (CSS_WIDE_KEYWORD.test(initial)) {
      violations.push(
        `${relPath}: @property ${name} initial-value '${initial}' is a CSS-wide keyword (rule is dropped)`,
      );
      continue;
    }
    if (TYPED_DIMENSION.test(syntax)) {
      if (RELATIVE_UNIT.test(initial)) {
        violations.push(
          `${relPath}: @property ${name} (syntax ${syntax}) initial-value '${initial}' uses a relative unit; typed dimensions need an absolute value`,
        );
      } else if (/\b(var|env)\(/.test(initial)) {
        violations.push(
          `${relPath}: @property ${name} (syntax ${syntax}) initial-value '${initial}' uses var()/env(); typed dimensions must be computationally independent`,
        );
      }
    }
  }
  return violations;
}

// --- the suite -------------------------------------------------------------

const CSS_FILES = walkCss(PROJECTS).map((f) => ({
  full: f,
  rel: '/' + relative(REPO_ROOT, f).replaceAll('\\', '/'),
}));

describe('css density + @property regression guard', () => {
  it('every component stylesheet referencing a spacing token derives it from the scale at a non-skin-gated host', () => {
    const offenders = [];
    for (const { full, rel } of CSS_FILES) {
      if (isDensityExcluded(rel) || DENSITY_ALLOWLIST.has(rel)) {
        continue;
      }
      const css = stripComments(readFileSync(full, 'utf8'));
      if (referencesSpacingToken(css) && !hasNonSkinGatedScaleSet(css)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `these stylesheets reference a *-gap/*-padding token but never SET one from --cngx-space-* at a non-skin-gated host (add the SET, or a DENSITY_ALLOWLIST entry with a one-clause reason):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('no @property registers an invalid initial-value (would be silently dropped)', () => {
    const violations = [];
    for (const { full, rel } of CSS_FILES) {
      const css = readFileSync(full, 'utf8');
      violations.push(...propertyViolations(css, rel));
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
