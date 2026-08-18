// Shared query helpers over a loaded DocsIndex. Every tool resolves entries
// through these two functions so name/selector matching stays consistent: an
// agent that knows the class name (`CngxSelect`) and one that knows the selector
// (`cngx-select`) reach the same entry.

import type { DocsIndex } from './data/loader.js';
import type { DocEntry } from './data/types.js';

export type EntryKind = 'component' | 'directive';

export interface KindedEntry {
  entry: DocEntry;
  kind: EntryKind;
}

function allEntries(docs: DocsIndex): KindedEntry[] {
  return [
    ...docs.components.map((entry) => ({ entry, kind: 'component' as const })),
    ...docs.directives.map((entry) => ({ entry, kind: 'directive' as const })),
  ];
}

/**
 * Resolve a single component/directive by exact name (case-insensitive), falling
 * back to an exact selector match so `cngx-select` resolves as readily as
 * `CngxSelect`. Returns `undefined` when nothing matches.
 */
export function resolveEntry(docs: DocsIndex, name: string): KindedEntry | undefined {
  const needle = name.trim().toLowerCase();
  if (needle === '') {
    return undefined;
  }
  const entries = allEntries(docs);
  return (
    entries.find(({ entry }) => entry.name.toLowerCase() === needle) ??
    entries.find(({ entry }) => entry.selector?.toLowerCase() === needle)
  );
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
