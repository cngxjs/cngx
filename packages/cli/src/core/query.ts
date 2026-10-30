// Shared query helpers over a loaded DocsIndex. Every tool resolves entries
// through these two functions so name/selector matching stays consistent: an
// agent that knows the class name (`CngxSelect`) and one that knows the selector
// (`cngx-select`) reach the same entry.

import type { DocsIndex } from './data/loader.js';
import type { DocEntry } from './data/types.js';
import { defaultFound } from './found.js';

export type EntryKind = 'component' | 'directive' | 'injectable';

export interface KindedEntry {
  entry: DocEntry;
  kind: EntryKind;
}

/**
 * The one canonical `components + directives + injectables` union. Every
 * enumeration - search, resolve, and the `list_components` browse tool - walks
 * this so there is a single source for "what entries exist". Injectables are the
 * scoped services (CngxToaster, CngxDialogOpener, ...) - part of the public API,
 * so part of the query surface; they resolve by name only (no selector).
 */
export function allEntries(docs: DocsIndex): KindedEntry[] {
  return [
    ...docs.components.map((entry) => ({ entry, kind: 'component' as const })),
    ...docs.directives.map((entry) => ({ entry, kind: 'directive' as const })),
    ...docs.injectables.map((entry) => ({ entry, kind: 'injectable' as const })),
  ];
}

/**
 * Derive the owning lib from an entry's `file` path. Files live at
 * `projects/<lib>/...`, so the first segment under `projects/` is the lib.
 * Returns `null` when `file` is absent or off-pattern - a lib could not be
 * derived, and a category string is not a lib, so nothing is substituted.
 */
export function entryLib(entry: DocEntry): string | null {
  const match = entry.file?.match(/^projects\/([^/]+)\//);
  return match ? match[1] : null;
}

/** One entry a selector matched, as an ambiguity result lists it. */
export interface EntryCandidate {
  name: string;
  kind: EntryKind;
  selector: string | null;
}

/** Several entries share the best selector match; the caller must ask again by a candidate's class name. */
export interface AmbiguousMatch {
  ambiguous: true;
  candidates: EntryCandidate[];
}

/** Whether a query answer is the ambiguity result rather than an entry's payload. */
export function isAmbiguous(value: unknown): value is AmbiguousMatch {
  return typeof value === 'object' && value !== null && (value as { ambiguous?: unknown }).ambiguous === true;
}

/** A name query's payload counts as found by the default rule, and never when it is an ambiguity. */
export function foundUnlessAmbiguous(payload: unknown): boolean {
  return defaultFound(payload) && !isAmbiguous(payload);
}

/** Selector key ranks, best first: an exact part, the attribute of a one-attribute part, the first attribute of a compound part. */
const EXACT_PART = 1;
const SOLE_ATTRIBUTE = 2;
const LEADING_ATTRIBUTE = 3;

/**
 * The lower-cased keys one selector answers to, each with its best rank. Every
 * comma-separated part is a rank-1 key. A part with exactly one attribute adds
 * `[attr]` and the bare `attr` at rank 2; a compound part adds its first
 * attribute at rank 3 and nothing for the refining ones. So
 * `cngx-checkbox, [cngxCheckbox]` answers to `[cngxcheckbox]` at rank 1 and
 * `cngxcheckbox` at rank 2, while `input[cngxInputMask][formControl]` answers
 * to `cngxinputmask` only at rank 3 and never to `formcontrol`.
 */
function selectorKeys(selector: string): Map<string, number> {
  const keys = new Map<string, number>();
  const add = (key: string, rank: number) => keys.set(key, Math.min(rank, keys.get(key) ?? rank));
  for (const part of selector.toLowerCase().split(',')) {
    const trimmed = part.trim();
    if (trimmed === '') {
      continue;
    }
    add(trimmed, EXACT_PART);
    const attrs = [...trimmed.matchAll(/\[\s*([^\]=\s]+)[^\]]*\]/g)].map(([, attr]) => attr);
    if (attrs.length === 0) {
      continue;
    }
    const rank = attrs.length === 1 ? SOLE_ATTRIBUTE : LEADING_ATTRIBUTE;
    add(`[${attrs[0]}]`, rank);
    add(attrs[0], rank);
  }
  return keys;
}

const byName = (a: EntryCandidate, b: EntryCandidate): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0;

/**
 * Resolve a single component/directive by exact name (case-insensitive), falling
 * back to its selector, so `cngx-select`, `[cngxCheckbox]` or the bare attribute
 * `cngxButton` resolve too. A name match wins over every selector key, also when
 * the needle is another entry's bare attribute: `cngxStepper` is `CngxStepper`,
 * while `[cngxStepper]` is `CngxStepperPresenter`. The bundled snapshot has four
 * such splits (`cngxStepper`, `cngxTabGroup`, `cngxTimelineItem`,
 * `cngxSelectOptgroup`); the bracketed attribute names the directive that carries
 * it. Among selector matches the best-ranked key wins (see `selectorKeys`). Two or
 * more entries sharing the best rank answer as {@link AmbiguousMatch}, candidates
 * sorted by name, so the answer never depends on snapshot order. Returns
 * `undefined` when nothing matches.
 */
export function resolveEntry(docs: DocsIndex, name: string): KindedEntry | AmbiguousMatch | undefined {
  const needle = name.trim().toLowerCase();
  if (needle === '') {
    return undefined;
  }
  const entries = allEntries(docs);
  const named = entries.find(({ entry }) => entry.name.toLowerCase() === needle);
  if (named) {
    return named;
  }
  let best: KindedEntry[] = [];
  let bestRank = Infinity;
  for (const match of entries) {
    const rank = match.entry.selector === undefined ? undefined : selectorKeys(match.entry.selector).get(needle);
    if (rank === undefined || rank > bestRank) {
      continue;
    }
    best = rank < bestRank ? [match] : [...best, match];
    bestRank = rank;
  }
  if (best.length < 2) {
    return best[0];
  }
  const candidates = best.map(({ entry, kind }) => ({ name: entry.name, kind, selector: entry.selector ?? null }));
  return { ambiguous: true, candidates: candidates.sort(byName) };
}

/**
 * Substring search across name / selector / category for `find_component`. The
 * data carries no `taggedSelector` key, so matching grounds on `selector`. An
 * empty query returns nothing rather than the whole surface.
 */
export function searchEntries(docs: DocsIndex, query: string): KindedEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [];
  }
  return allEntries(docs).filter(({ entry }) => {
    const haystack = [entry.name, entry.selector, entry.category].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}
