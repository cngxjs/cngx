// Version-scoped docs resolution. The entry-shape query tools close over the
// bundled `DocsIndex`; this resolver lets them answer for another release without
// a second network path. When a version is absent or matches the bundled snapshot
// the bundled index is returned with no fetch (the offline default). Otherwise the
// release's snapshot is fetched once through the fail-safe `fetchSnapshot` seam,
// cached in memory for the resolver's lifetime, and read through
// `loadDocsFromFile`. Every path stays inside the tools' don't-crash
// contract: a fetch or schema failure is returned as data, never thrown.

import { rebaseExampleUrls } from './example-urls.js';
import type { DocsIndex } from './loader.js';
import { loadDocsFromFile } from './loader.js';
import type { FetchSnapshot } from '../diff/snapshot-fetch.js';
import { fetchSnapshot, removeQuietly, removeTempDir } from '../diff/snapshot-fetch.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';

/** A resolved snapshot plus the version label it grounds against, or a typed failure. */
export type DocsResolution =
  | { ok: true; docs: DocsIndex; version: string | null }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/** Injectable side-effect seam so the cache + short-circuit are testable without `gh`. */
export interface DocsResolverDeps {
  fetchSnapshot: FetchSnapshot;
  loadDocs: typeof loadDocsFromFile;
  /** Removes the temp dir a fetch hands over once its snapshot is read. Defaults to a recursive delete. */
  removeDir?: (dir: string) => void;
}

const defaultDeps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir: removeTempDir };

/**
 * Upper bound on distinct release snapshots one resolver holds at once. A parsed
 * snapshot is a few hundred KB, and no realistic session grounds against more than a
 * handful of releases; the bound keeps a pathological caller from growing the map
 * without limit.
 */
export const DOCS_CACHE_LIMIT = 16;

/** Resolves a version against one bundled snapshot; what a command reaches through its context. */
export type DocsResolver = (version?: string) => Promise<DocsResolution>;

/**
 * Build a resolver over `bundled` and `deps`. Each adapter builds one, so a command
 * never sees the fetch or cache wiring. Short-circuits to `bundled` (no fetch) when
 * the version is empty or equals the bundled `cngxVersion`. A fetched-but-unreadable
 * snapshot - `loadDocsFromFile` throwing `SchemaVersionError` or a read error - maps
 * to `asset-missing`, so the three-reason failure union holds.
 */
export function createDocsResolver(bundled: DocsIndex, deps: DocsResolverDeps = defaultDeps): DocsResolver {
  // Fetched snapshots and fetches still in flight, keyed by requested version. Owned by
  // this resolver alone, so resolvers built over different deps never share an answer.
  const cache = new Map<string, DocsIndex>();
  const pending = new Map<string, Promise<DocsResolution>>();
  const bundledVersion = bundled.meta.cngxVersion;

  return async (version) => {
    const requested = version?.trim() ?? '';
    if (requested === '' || (bundledVersion !== null && requested === bundledVersion)) {
      return { ok: true, docs: bundled, version: bundledVersion };
    }

    const cached = cache.get(requested);
    if (cached) {
      return { ok: true, docs: cached, version: cached.meta.cngxVersion ?? requested };
    }

    // A second request for the same version joins the first instead of downloading again.
    const inFlight = pending.get(requested);
    if (inFlight) {
      return inFlight;
    }
    const resolution = fetchAndLoad(requested, deps, cache).finally(() => pending.delete(requested));
    pending.set(requested, resolution);
    return resolution;
  };
}

/** Cache a fetched snapshot, evicting the oldest entry (insertion order) once at capacity. */
function cacheDocs(cache: Map<string, DocsIndex>, version: string, docs: DocsIndex): void {
  if (cache.size >= DOCS_CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(version, docs);
}

async function fetchAndLoad(
  requested: string,
  deps: DocsResolverDeps,
  cache: Map<string, DocsIndex>,
): Promise<DocsResolution> {
  const fetched = await deps.fetchSnapshot(requested);
  if (!fetched.ok) {
    return { ok: false, reason: fetched.reason, message: fetched.message };
  }
  try {
    // A release asset is the raw docs:json export; only the bundled snapshot is
    // rebased at build time.
    const docs = rebaseExampleUrls(deps.loadDocs(fetched.path));
    cacheDocs(cache, requested, docs);
    // A successful download of the `v<version>` asset means the asset IS that version,
    // so an unstamped raw export still resolves to the requested label.
    return { ok: true, docs, version: docs.meta.cngxVersion ?? requested };
  } catch (error) {
    return {
      ok: false,
      reason: 'asset-missing',
      message: `Fetched snapshot for v${requested} could not be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    // The parsed index lives in memory from here on; the file on disk is never read again.
    if (fetched.dir !== undefined) {
      removeQuietly(deps.removeDir ?? removeTempDir, fetched.dir);
    }
  }
}

/**
 * A tool answer wrapped with the version it grounded against, or a typed failure.
 * `ok` discriminates both arms: a caller narrows on `ok === true`, never on the
 * presence or absence of `groundedVersion`.
 */
export type VersionedAnswer<T> =
  | { ok: true; groundedVersion: string | null; result: T }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/**
 * Resolve `version` through `resolve`, then run `query` against the resolved snapshot and wrap the
 * result with `groundedVersion`. The uniform envelope is why this lives here and
 * not inline per tool: `get_di_tokens` / `find_component` return arrays that cannot
 * carry the version otherwise, so every tool wraps identically.
 */
export async function answerVersioned<T>(
  resolve: DocsResolver,
  version: string | undefined,
  query: (docs: DocsIndex) => T,
): Promise<VersionedAnswer<T>> {
  try {
    const resolution = await resolve(version);
    if (!resolution.ok) {
      return { ok: false, reason: resolution.reason, message: resolution.message };
    }
    return { ok: true, groundedVersion: resolution.version, result: query(resolution.docs) };
  } catch (error) {
    // Neither the resolver nor a query over a resolved snapshot is expected to throw,
    // but a version-scoped tool reaches the network and must answer as data, never throw
    // across the stdio boundary. Map to the catch-all reason migrate_usage's outer net uses;
    // the `internal:` prefix tells a caller this is a defect, not a missing release.
    return { ok: false, reason: 'asset-missing', message: `internal: ${error instanceof Error ? error.message : String(error)}` };
  }
}
