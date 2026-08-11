import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the forced-colors (Windows High Contrast Mode) survival
// sweep. Three orthogonal concerns, mirroring the motion + touch-target guards:
//
// 1. Net integrity - forced-colors.css carries the two GLOBAL things (the
//    `forced-color-adjust` preserve-image baseline and the per-component
//    contract). It must NOT style focus: cngx's `outline` focus ring
//    (reset.css) self-heals under WHCM because the UA forces `outline-color`
//    (even `transparent`) to a system colour, so a net focus rule would only
//    fight the forcing. This guard pins both invariants.
//
// 2. Cascade wiring - an un-imported core theming CSS is inert, so the net
//    could regress to dead without any other test failing. The import
//    assertion locks the commit-1 wiring, parity with the motion + contrast
//    guards.
//
// 3. Source-completeness scan (the enforcement spine) - it walks every
//    `projects/**/*.css` whose text `.includes()` a frozen affordance
//    substring and, in HARD-FAIL mode, fails when a flagged file is neither
//    hardened (FORCED_COLORS_HARDENED_HOSTS) nor consciously excluded
//    (EXCLUDED_HOSTS). `box-shadow` is the one WHCM break a flat scan can
//    reliably detect: it is forced to `none`, so any elevation / focus /
//    selected boundary drawn with a shadow is silently lost. Transparent
//    borders/outlines are deliberately NOT scanned - they self-heal (the UA
//    forces `transparent` to an opaque system colour), so flagging them would
//    harden the wrong half. Background-tint-only state is a genuine break but
//    is NOT flatly scannable ("tint differs from parent, no border, no
//    shadow" is not expressible with `.includes()`), so it is an
//    author-review checklist item per wave - a documented blind spot, not
//    machine-enforced.
//
// Warn vs hard-fail: the scan starts as a warning (SCAN_HARD_FAIL = false) and
// flips to hard-fail in Phase E once every lib's box-shadow hosts are hardened,
// so intermediate waves are not blocked by not-yet-hardened libs. Flipping the
// single const below is the Phase-E enforcement switch.
//
// NOTE ON THE MANIFEST vs THE FLAGGED SET: the hardened manifest is NOT a
// subset of the box-shadow-flagged set. Most WHCM breaks in the display layer
// are background/tint-drawn (a radio dot painted with `background`, a divider
// line painted with `background`, a chip's tint-only selected state), which
// carry no `box-shadow` and so are never flagged - yet they are the genuine
// breaks the author review catches and hardens. The manifest therefore tracks
// "files that ship a forced-colors block" (verified per-file below), which is
// broader than the scannable box-shadow subset. The EXCLUDED_HOSTS list, by
// contrast, only ever names files the scan DOES flag (asserted below) so an
// exclusion is always a conscious answer to a real flag.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const readRepoCss = (relPath: string): string =>
  readFileSync(resolve(REPO_ROOT, relPath), 'utf-8');

const FORCED_COLORS_CSS = 'projects/core/theming/forced-colors.css';
const THEMES_ENTRY_CSS = 'projects/themes/cngx.css';

// The frozen affordance substring. A stylesheet counts as a machine-scannable
// forced-colors affordance when its text `.includes()` one of these. `box-shadow`
// is the only break a flat scan detects (forced to `none`). Adding a substring is
// a reviewable guard change, never a silent widening.
const AFFORDANCE_SUBSTRINGS = ['box-shadow'] as const;

// Phase A: warn. The source scan surfaces unhardened box-shadow hosts in
// not-yet-swept libs but does not fail. Phase E flips this to `true`, turning
// the completeness scan into a hard CI gate.
const SCAN_HARD_FAIL = false;

// Every stylesheet that ships a hand-authored `@media (forced-colors: active)`
// block. Grows one wave at a time (parity with MOTION_AWARE_HOSTS). A file lands
// here whether its break was a scannable `box-shadow` or an author-reviewed
// tint/background collapse - the per-file assertion below only checks that the
// block exists.
const FORCED_COLORS_HARDENED_HOSTS: readonly string[] = [
  // @cngx/common/display - tint/background-drawn breaks (not box-shadow; caught
  // by author review, not the flat scan)
  'projects/common/display/chip/chip.component.css',
  'projects/common/display/radio-indicator/radio-indicator.component.css',
  'projects/common/theming/components/cngx-badge.css',
  'projects/common/theming/components/cngx-divider.css',
  // @cngx/common/interactive (Phase B) - box-shadow / tint state breaks
  'projects/common/interactive/toggle/toggle.component.css',
  'projects/common/theming/components/cngx-button-toggle.css',
  'projects/common/theming/components/cngx-listbox.css',
  'projects/common/theming/components/cngx-menu.css',
  // @cngx/common/data (Phase B) - current-page tint + goal bar background breaks
  'projects/common/data/paginate/styles/paginator-base.css',
  'projects/common/data/display/goal/goal.component.css',
];

// Files the box-shadow scan flags but that legitimately do NOT need a
// forced-colors block. Each carries a one-clause reason. The scan asserts every
// entry here is actually flagged, so a stale exclusion cannot hide.
const EXCLUDED_HOSTS: ReadonlyArray<{ file: string; note: string }> = [
  {
    file: 'projects/core/theming/system-tokens.css',
    note: 'the word "box-shadow" appears only in a token-doc comment; the file is the @property registry, not an affordance',
  },
];

// Recursively collect every `.css` under a repo-relative directory, returning
// repo-relative POSIX paths that match the manifest's path shape.
const walkCss = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      out.push(...walkCss(rel));
    } else if (entry.endsWith('.css')) {
      out.push(rel);
    }
  }
  return out;
};

const flagsAsAffordance = (css: string): boolean =>
  AFFORDANCE_SUBSTRINGS.some((substring) => css.includes(substring));

const FLAGGED_CSS = walkCss('projects').filter((file) => flagsAsAffordance(readRepoCss(file)));

// Strip CSS comments so the "does not style focus" assertion reads the RULES,
// not the @overview prose (which explains WHY focus is left alone and so
// legitimately names focus / outline).
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('forced-colors net integrity', () => {
  const net = readRepoCss(FORCED_COLORS_CSS);
  const netRules = stripComments(net);

  it('gates on `@media (forced-colors: active)` and declares the forced-color-adjust baseline', () => {
    expect(net).toContain('@media (forced-colors: active)');
    expect(net).toContain('forced-color-adjust');
  });

  it('does NOT style focus - the outline reset self-heals under WHCM', () => {
    // A net focus rule would fight the UA forcing of `outline-color`. The
    // @overview comment names focus / outline to explain the self-heal, so
    // assert against the stripped rules, not the raw text.
    expect(netRules).not.toContain('focus');
    expect(netRules).not.toContain('outline');
  });
});

describe('forced-colors net cascade wiring', () => {
  it('@imports forced-colors.css into the themes entry (so the net is not inert)', () => {
    const entry = readRepoCss(THEMES_ENTRY_CSS);
    expect(entry).toContain("@import '../core/theming/forced-colors.css';");
  });
});

describe('forced-colors hardened-hosts manifest', () => {
  it.each(FORCED_COLORS_HARDENED_HOSTS)('%s retains its forced-colors block', (file) => {
    expect(readRepoCss(file)).toContain('forced-colors: active');
  });

  it('fixes the manifest size so a bulk edit dropping several hosts is caught', () => {
    expect(FORCED_COLORS_HARDENED_HOSTS.length).toBe(10);
  });
});

describe('forced-colors source-completeness scan', () => {
  const hardened = new Set(FORCED_COLORS_HARDENED_HOSTS);
  const excluded = new Set(EXCLUDED_HOSTS.map((h) => h.file));

  it('freezes the affordance substring set to the single box-shadow token', () => {
    expect(AFFORDANCE_SUBSTRINGS).toEqual(['box-shadow']);
  });

  it('never lists a file as both hardened and excluded', () => {
    const both = [...hardened].filter((file) => excluded.has(file));
    expect(both).toEqual([]);
  });

  it.each(EXCLUDED_HOSTS)('$file is actually flagged by the scan (no stale exclusion)', ({ file }) => {
    expect(FLAGGED_CSS).toContain(file);
  });

  it.each(FLAGGED_CSS)('%s is hardened or explicitly excluded', (file) => {
    const accounted = hardened.has(file) || excluded.has(file);
    // Warn mode (Phase A): `accounted || !SCAN_HARD_FAIL` is always true, so an
    // unhardened box-shadow host in a not-yet-swept lib does not block the wave.
    // Hard-fail mode (Phase E): the term collapses to `accounted`, turning this
    // into the real completeness gate.
    expect(
      accounted || !SCAN_HARD_FAIL,
      `${file} carries a box-shadow affordance but is neither in ` +
        `FORCED_COLORS_HARDENED_HOSTS nor EXCLUDED_HOSTS. Add an ` +
        `@media (forced-colors: active) block that re-draws its lost ` +
        `boundary and enroll it, or add it to EXCLUDED_HOSTS with a ` +
        `one-clause reason.`,
    ).toBe(true);
  });
});
