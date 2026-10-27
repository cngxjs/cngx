// Example URL rebase for snapshots fetched at runtime. A release asset is the raw
// `docs:json` export, so its `exampleUrls` carry the build-time base
// (`http://localhost:4200`). The bundled snapshot is rebased once at build time by
// `scripts/mcp-snapshot.mjs`; this applies the same rule to a fetched one, so
// every version answers with URLs a consumer can open.

import type { DocsIndex } from './loader.js';
import type { DocEntry } from './types.js';

/** The published examples app every example URL points at. */
export const EXAMPLES_BASE_URL = 'https://cngxjs.github.io/cngx/examples';

// Everything before the `/#/` hash route is swapped for `base`; a URL without a
// hash route is left alone.
function rebaseUrl(url: string, base: string): string {
  const at = url.indexOf('/#/');
  return at === -1 ? url : base + url.slice(at);
}

function rebaseEntry(entry: DocEntry, base: string): DocEntry {
  return entry.exampleUrls ? { ...entry, exampleUrls: entry.exampleUrls.map((url) => rebaseUrl(url, base)) } : entry;
}

/**
 * Rebase the `exampleUrls` of every component, directive and injectable onto
 * `base` (trailing slashes dropped). Pure; the input is not mutated.
 */
export function rebaseExampleUrls(docs: DocsIndex, base: string = EXAMPLES_BASE_URL): DocsIndex {
  const root = base.replace(/\/+$/, '');
  const rebase = (entries: DocEntry[]) => entries.map((entry) => rebaseEntry(entry, root));
  return {
    ...docs,
    components: rebase(docs.components),
    directives: rebase(docs.directives),
    injectables: rebase(docs.injectables),
  };
}
