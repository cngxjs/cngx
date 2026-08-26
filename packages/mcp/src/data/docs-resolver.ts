// Version-scoped docs resolution. The entry-shape query tools close over the
// bundled `DocsIndex`; this resolver lets them answer for another release without
// a second network path. When a version is absent or matches the bundled snapshot
// the bundled index is returned with no fetch (the offline default). Otherwise the
// release's snapshot is fetched once through the same fail-safe `fetchSnapshot`
// seam `migrate_usage` uses, cached in memory for the process lifetime, and read
// through `loadDocsFromFile`. Every path stays inside the tools' don't-crash
// contract: a fetch or schema failure is returned as data, never thrown.

import type { DocsIndex } from './loader.js';
import { loadDocsFromFile } from './loader.js';
import { fetchSnapshot } from '../diff/snapshot-fetch.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';

/** A resolved snapshot plus the version label it grounds against, or a typed failure. */
export type DocsResolution =
  | { ok: true; docs: DocsIndex; version: string | null }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/** Injectable side-effect seam so the cache + short-circuit are testable without `gh`. */
export interface DocsResolverDeps {
  fetchSnapshot: typeof fetchSnapshot;
  loadDocs: typeof loadDocsFromFile;
}

const defaultDeps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

// Keyed by requested version. Populated on first successful fetch; process-lifetime
// only - a session-scoped stdio server needs no disk-backed cache.
const cache = new Map<string, DocsIndex>();

/** Drop the in-memory cache. Test seam so a cache-hit assertion starts from empty. */
export function resetDocsCache(): void {
  cache.clear();
}

/**
 * Resolve `version` to a `DocsIndex`. Short-circuits to `bundled` (no fetch) when
 * `version` is empty or equals the bundled `cngxVersion`. A fetched-but-unreadable
 * snapshot - `loadDocsFromFile` throwing `SchemaVersionError` or a read error - maps
 * to `asset-missing`, mirroring `migrate_usage` so the three-reason failure union holds.
 */
export function resolveDocs(bundled: DocsIndex, version?: string, deps: DocsResolverDeps = defaultDeps): DocsResolution {
  const requested = version?.trim() ?? '';
  const bundledVersion = bundled.meta.cngxVersion;

  if (requested === '' || (bundledVersion !== null && requested === bundledVersion)) {
    return { ok: true, docs: bundled, version: bundledVersion };
  }

  const cached = cache.get(requested);
  if (cached) {
    return { ok: true, docs: cached, version: cached.meta.cngxVersion ?? requested };
  }

  const fetched = deps.fetchSnapshot(requested);
  if (!fetched.ok) {
    return { ok: false, reason: fetched.reason, message: fetched.message };
  }
  try {
    const docs = deps.loadDocs(fetched.path);
    cache.set(requested, docs);
    // A successful `gh release download v<version>` means the asset IS that version,
    // so an unstamped raw export still resolves to the requested label.
    return { ok: true, docs, version: docs.meta.cngxVersion ?? requested };
  } catch (error) {
    return {
      ok: false,
      reason: 'asset-missing',
      message: `Fetched snapshot for v${requested} could not be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** A tool answer wrapped with the version it grounded against, or a typed failure. */
export type VersionedAnswer<T> =
  | { groundedVersion: string | null; result: T }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/**
 * Resolve `version`, then run `query` against the resolved snapshot and wrap the
 * result with `groundedVersion`. The uniform envelope is why this lives here and
 * not inline per tool: `get_di_tokens` / `find_component` return arrays that cannot
 * carry the version otherwise, so every tool wraps identically.
 */
export function answerVersioned<T>(
  bundled: DocsIndex,
  version: string | undefined,
  query: (docs: DocsIndex) => T,
  deps: DocsResolverDeps = defaultDeps,
): VersionedAnswer<T> {
  const resolution = resolveDocs(bundled, version, deps);
  if (!resolution.ok) {
    return { ok: false, reason: resolution.reason, message: resolution.message };
  }
  return { groundedVersion: resolution.version, result: query(resolution.docs) };
}
