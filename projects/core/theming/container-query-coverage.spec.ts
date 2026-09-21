import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Coverage guard for the responsive-by-default contract
// (`core-concepts/responsive-by-default.md`). Two rules, both unenforceable by
// the type system:
//
//   1. A `@container` size query is named `cngx-<component>` and every length
//      in its condition is one of the four rem tiers. An unnamed query matches
//      the nearest container of ANY name, so a consumer wrapping the component
//      in their own container would silently re-target it; a free px literal
//      opts the breakpoint out of `CNGX_TEXT_SCALE`, which sets a real root
//      `font-size`.
//   2. In-flow layout does not react to the viewport. A `@media` rule carrying
//      a width condition is either enrolled below with a reason (overlay
//      modality, or a pending migration) or it fails.
//
// The manifest halves are ratchets, not permanent carve-outs: A1 slice 2
// empties both. Adding a file to either list requires a one-clause reason, so
// the exception stays a reviewable touchpoint - same shape as the touch-target
// and density guards in this directory.
//
// Preference queries (`prefers-*`, `forced-colors`, `hover`, `pointer`) are not
// responsive rules and never enter the scan. Style queries
// (`@container style(...)`) carry no size condition and are skipped too.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

/** The rem rungs from the contract. A component picks a rung, never a literal. */
const TIERS: readonly string[] = ['20rem', '30rem', '48rem', '64rem'];

/** `@container` size queries whose length is not yet on a tier. */
const TIER_EXCEPTIONS: ReadonlyArray<{ file: string; note: string }> = [
  {
    file: 'projects/ui/stepper/styles/stepper-base.css',
    note: '600px panel-padding break, predates the tier table; A1 slice 2 moves it to 48rem',
  },
  {
    file: 'projects/ui/timeline/timeline.component.css',
    note: '32rem raster collapse, predates the tier table; A1 slice 2 moves it to 30rem',
  },
  {
    file: 'projects/common/timeline/timeline-item.component.css',
    note: 'queries the same 32rem as its ui/timeline host; migrates with it in A1 slice 2',
  },
  {
    file: 'projects/ui/paginator/paginator.component.css',
    note: '24rem number-row swap sits between xs and sm; A1 slice 2 decides which rung',
  },
];

/** `@media` rules carrying a width condition on in-flow layout. */
const VIEWPORT_MEDIA_ALLOWED: ReadonlyArray<{ file: string; note: string }> = [
  {
    file: 'projects/data-display/treetable/treetable.component.css',
    note: '960px indent narrowing, in-flow and viewport-driven; A1 slice 2 converts it to @container cngx-treetable',
  },
];

const tierExceptionFiles = new Set(TIER_EXCEPTIONS.map((entry) => entry.file));
const viewportAllowedFiles = new Set(VIEWPORT_MEDIA_ALLOWED.map((entry) => entry.file));

/**
 * Comment bodies contain prose that reads like a query (`@media (hover: none)`
 * in an @overview block). Strip them before scanning or the guard reports
 * documentation as code.
 */
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

const SIZE_FEATURE = /\b(?:min-|max-)?(?:width|height|inline-size|block-size)\b/;
const LENGTH = /\d*\.?\d+(?:rem|px|em|ch|vw|vh|vi|vb)/g;

export interface ContainerQueryFinding {
  readonly name: string;
  readonly condition: string;
  readonly offTierLengths: readonly string[];
}

export interface CssScanResult {
  readonly containerQueries: readonly ContainerQueryFinding[];
  readonly viewportMedia: readonly string[];
}

/**
 * Pure scanner over one stylesheet's text. Exported so the negative fixtures
 * below can prove the guard is capable of failing - a manifest that only ever
 * reports green is indistinguishable from a broken matcher.
 */
export function scanCss(source: string): CssScanResult {
  const css = stripComments(source);
  const containerQueries: ContainerQueryFinding[] = [];
  const viewportMedia: string[] = [];

  for (const match of css.matchAll(/@container\s+([^{]*)\{/g)) {
    const head = match[1].trim();
    if (head.startsWith('style(') || head.startsWith('not style(')) {
      continue;
    }
    const name = /^([A-Za-z_-][\w-]*)\s*(?=\(|$)/.exec(head)?.[1] ?? '';
    const condition = head.slice(name.length).trim();
    if (!SIZE_FEATURE.test(condition)) {
      continue;
    }
    const offTierLengths = [...condition.matchAll(LENGTH)]
      .map((length) => length[0])
      .filter((length) => !TIERS.includes(length));
    containerQueries.push({ name, condition, offTierLengths });
  }

  for (const match of css.matchAll(/@media\s+([^{]*)\{/g)) {
    const condition = match[1].trim();
    if (/\b(?:min|max)-(?:width|inline-size)\b/.test(condition)) {
      viewportMedia.push(condition);
    }
  }

  return { containerQueries, viewportMedia };
}

const walkStylesheets = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      if (entry === 'examples') {
        continue;
      }
      out.push(...walkStylesheets(rel));
    } else if (/\.(?:css|scss)$/.test(entry) && !entry.includes('.spec.')) {
      out.push(rel);
    }
  }
  return out;
};

const STYLESHEETS = walkStylesheets('projects');
const scanned = STYLESHEETS.map((file) => ({
  file,
  result: scanCss(readFileSync(resolve(REPO_ROOT, file), 'utf-8')),
}));

describe('container-query contract', () => {
  it('finds stylesheets to scan', () => {
    expect(STYLESHEETS.length).toBeGreaterThan(50);
  });

  it('names every @container size query cngx-<component>', () => {
    const unnamed = scanned.flatMap(({ file, result }) =>
      result.containerQueries
        .filter((query) => !/^cngx-[a-z-]+$/.test(query.name))
        .map((query) => `${file}: @container ${query.name || '<unnamed>'} ${query.condition}`),
    );
    expect(unnamed).toEqual([]);
  });

  it('keeps every @container length on a tier', () => {
    const offTier = scanned.flatMap(({ file, result }) =>
      tierExceptionFiles.has(file)
        ? []
        : result.containerQueries
            .filter((query) => query.offTierLengths.length > 0)
            .map((query) => `${file}: ${query.offTierLengths.join(', ')} in ${query.condition}`),
    );
    expect(offTier).toEqual([]);
  });

  it('keeps in-flow layout off the viewport', () => {
    const viewportDriven = scanned.flatMap(({ file, result }) =>
      viewportAllowedFiles.has(file)
        ? []
        : result.viewportMedia.map((condition) => `${file}: @media ${condition}`),
    );
    expect(viewportDriven).toEqual([]);
  });
});

describe('container-query exception ratchet', () => {
  it.each(TIER_EXCEPTIONS)('$file still carries the off-tier query ($note)', ({ file }) => {
    const entry = scanned.find((candidate) => candidate.file === file);
    expect(entry, `${file} is enrolled but not scanned`).toBeDefined();
    expect(
      entry?.result.containerQueries.some((query) => query.offTierLengths.length > 0),
      `${file} no longer has an off-tier @container length - drop it from TIER_EXCEPTIONS`,
    ).toBe(true);
  });

  it.each(VIEWPORT_MEDIA_ALLOWED)('$file still carries the width media ($note)', ({ file }) => {
    const entry = scanned.find((candidate) => candidate.file === file);
    expect(entry, `${file} is enrolled but not scanned`).toBeDefined();
    expect(
      entry?.result.viewportMedia.length,
      `${file} no longer has a width @media - drop it from VIEWPORT_MEDIA_ALLOWED`,
    ).toBeGreaterThan(0);
  });
});

describe('container-query scanner', () => {
  it('reports an unnamed size query', () => {
    const { containerQueries } = scanCss(
      '@container (max-inline-size: 30rem) { .x { color: red; } }',
    );
    expect(containerQueries).toEqual([
      { name: '', condition: '(max-inline-size: 30rem)', offTierLengths: [] },
    ]);
  });

  it('reports an off-tier length', () => {
    const { containerQueries } = scanCss(
      '@container cngx-thing (max-width: 42rem) { .x { color: red; } }',
    );
    expect(containerQueries[0]?.offTierLengths).toEqual(['42rem']);
  });

  it('reports a width media query', () => {
    expect(scanCss('@media (max-width: 960px) { .x { color: red; } }').viewportMedia).toEqual([
      '(max-width: 960px)',
    ]);
  });

  it('ignores preference media queries', () => {
    const preferences =
      '@media (prefers-reduced-motion: reduce) { .x { color: red; } }' +
      '@media (forced-colors: active) { .x { color: red; } }' +
      '@media (hover: none) { .x { color: red; } }';
    expect(scanCss(preferences).viewportMedia).toEqual([]);
  });

  it('ignores style queries, including the negated form', () => {
    const styleQueries =
      '@container style(--cngx-accordion-marker: none) { .x { color: red; } }' +
      '@container not style(--cngx-paginator-collapse: none) { .x { color: red; } }';
    expect(scanCss(styleQueries).containerQueries).toEqual([]);
  });

  it('ignores queries that live inside a comment', () => {
    const commented = '/* @media (max-width: 960px) is documented here */ .x { color: red; }';
    expect(scanCss(commented).viewportMedia).toEqual([]);
  });

  it('accepts a named tier query', () => {
    const { containerQueries } = scanCss(
      '@container cngx-thing (min-inline-size: 64rem) { .x { color: red; } }',
    );
    expect(containerQueries).toEqual([
      { name: 'cngx-thing', condition: '(min-inline-size: 64rem)', offTierLengths: [] },
    ]);
  });
});
