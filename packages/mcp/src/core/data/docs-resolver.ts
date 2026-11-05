// Version-scoped docs resolution. The entry-shape query tools close over the
// bundled `DocsIndex`; this resolver lets them answer for another release without
// a second network path. When a version is absent or matches the bundled snapshot
// the bundled index is returned with no fetch (the offline default). Otherwise the
// release's snapshot is fetched once through the fail-safe `fetchSnapshot` seam,
// cached in memory for the resolver's lifetime, and read through
// `loadDocsFromFile`. Every path stays inside the tools' don't-crash
// contract: a fetch or schema failure is returned as data, never thrown. A second
// resolver does the same for the separate `error-codes.json` asset, which only
// `get_error_code` reaches.

import { rebaseExampleUrls } from './example-urls.js';
import type { DocsIndex, ErrorCodeIndex } from './loader.js';
import { loadDocsFromFile, loadErrorCodesFromFile, SnapshotLoadError } from './loader.js';
import type { FetchSnapshot } from '../diff/snapshot-fetch.js';
import { fetchErrorCodes, fetchSnapshot, normalizeReleaseVersion, removeQuietly, removeTempDir } from '../diff/snapshot-fetch.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';
import type { SnapshotCache } from './snapshot-cache.js';

/** A resolved release asset plus the version label it grounds against, or a typed failure. */
export type ReleaseResolution<D> =
  | { ok: true; docs: D; version: string | null }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/** A resolved snapshot plus the version label it grounds against, or a typed failure. */
export type DocsResolution = ReleaseResolution<DocsIndex>;

/** Injectable side-effect seam so the cache + short-circuit are testable without `gh`. */
export interface DocsResolverDeps {
  fetchSnapshot: FetchSnapshot;
  loadDocs: typeof loadDocsFromFile;
  /** Removes the temp dir a fetch hands over once its snapshot is read. Defaults to a recursive delete. */
  removeDir?: (dir: string) => void;
  /** Disk cache read before a fetch and written after a successful load. The MCP server leaves it unset. */
  cache?: SnapshotCache;
  /** Answer from the cache only; `fetchSnapshot` is never called. */
  offline?: boolean;
}

const defaultDeps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir: removeTempDir };

/**
 * Upper bound on distinct release snapshots one resolver holds at once. A parsed
 * snapshot is a few hundred KB, and no realistic session grounds against more than a
 * handful of releases; the bound keeps a pathological caller from growing the map
 * without limit.
 */
export const DOCS_CACHE_LIMIT = 16;

/** Resolves a version against one bundled release asset. */
export type ReleaseResolver<D> = (version?: string) => Promise<ReleaseResolution<D>>;

/** Resolves a version against one bundled snapshot; what a command reaches through its context. */
export type DocsResolver = ReleaseResolver<DocsIndex>;

/** One kind of release asset: what answers without a fetch, and how a fetched file becomes `D`. */
interface ReleaseAssetSource<D> {
  readonly bundled: D;
  readonly bundledVersion: string | null;
  /** What the fetched-load failure calls the asset. */
  readonly label: string;
  readonly fetch: FetchSnapshot;
  load(path: string): D;
  /** The version a loaded asset says it is; null resolves to the requested version. */
  versionOf(value: D): string | null;
  readonly removeDir?: (dir: string) => void;
  readonly cache?: SnapshotCache;
  readonly offline?: boolean;
}

/**
 * Build a resolver over `bundled` and `deps`. Each adapter builds one, so a command
 * never sees the fetch or cache wiring. Short-circuits to `bundled` (no fetch) when
 * the version is absent or equals the bundled `cngxVersion`; a blank version is a
 * typed failure, never the bundled snapshot. A malformed or blank version answers
 * `invalid-version` before any fetch. A fetched-but-unreadable snapshot -
 * `loadDocsFromFile` throwing `SchemaVersionError` or a read error - maps to
 * `asset-missing`.
 */
export function createDocsResolver(bundled: DocsIndex, deps: DocsResolverDeps = defaultDeps): DocsResolver {
  return createReleaseResolver<DocsIndex>({
    bundled,
    bundledVersion: bundled.meta.cngxVersion,
    label: 'snapshot',
    fetch: deps.fetchSnapshot,
    // A release asset is the raw docs:json export; only the bundled snapshot is
    // rebased at build time.
    load: (path) => rebaseExampleUrls(deps.loadDocs(path)),
    versionOf: (docs) => docs.meta.cngxVersion,
    removeDir: deps.removeDir,
    cache: deps.cache,
    offline: deps.offline,
  });
}

/** Injectable side-effect seam of {@link createErrorCodeResolver}; the same rules as {@link DocsResolverDeps}. */
export interface ErrorCodeResolverDeps {
  fetchErrorCodes: FetchSnapshot;
  loadErrorCodes?: typeof loadErrorCodesFromFile;
  removeDir?: (dir: string) => void;
  cache?: SnapshotCache;
  offline?: boolean;
}

/** Resolves a version against the bundled error-code block; `get_error_code` reaches it through its context. */
export type ErrorCodeResolver = ReleaseResolver<ErrorCodeIndex | null>;

/**
 * Build a resolver over the error-code block of `bundled`, with the rules of
 * {@link createDocsResolver}. The asset carries no release stamp, so a fetched answer
 * grounds on the requested version.
 */
export function createErrorCodeResolver(
  bundled: DocsIndex,
  deps: ErrorCodeResolverDeps = { fetchErrorCodes, removeDir: removeTempDir },
): ErrorCodeResolver {
  return createReleaseResolver<ErrorCodeIndex | null>({
    bundled: bundled.errorCodes,
    bundledVersion: bundled.meta.cngxVersion,
    label: 'error-code asset',
    fetch: deps.fetchErrorCodes,
    load: deps.loadErrorCodes ?? loadErrorCodesFromFile,
    versionOf: () => null,
    removeDir: deps.removeDir,
    cache: deps.cache,
    offline: deps.offline,
  });
}

function createReleaseResolver<D>(source: ReleaseAssetSource<D>): ReleaseResolver<D> {
  // Fetched assets and fetches still in flight, keyed by requested version. Owned by
  // this resolver alone, so resolvers built over different deps never share an answer.
  const cache = new Map<string, D>();
  const pending = new Map<string, Promise<ReleaseResolution<D>>>();
  const { bundled, bundledVersion } = source;

  return async (version) => {
    // Only an absent version means "bundled"; a blank string is a caller error, not a default.
    if (version === undefined) {
      return { ok: true, docs: bundled, version: bundledVersion };
    }
    // Release tags are `v<version>`, so a pasted tag answers like the bare version.
    const normalized = normalizeReleaseVersion(version);
    if (!normalized.ok) {
      return { ok: false, reason: 'invalid-version', message: normalized.message };
    }
    const requested = normalized.version;
    if (bundledVersion !== null && requested === bundledVersion) {
      return { ok: true, docs: bundled, version: bundledVersion };
    }

    // `D` may include null, so a memo hit is anything but undefined.
    const cached = cache.get(requested);
    if (cached !== undefined) {
      return { ok: true, docs: cached, version: source.versionOf(cached) ?? requested };
    }

    // A second request for the same version joins the first instead of downloading again.
    const inFlight = pending.get(requested);
    if (inFlight) {
      return inFlight;
    }
    const resolution = fetchAndLoad(requested, source, cache).finally(() => pending.delete(requested));
    pending.set(requested, resolution);
    return resolution;
  };
}

/** Cache a fetched asset, evicting the oldest entry (insertion order) once at capacity. */
function cacheDocs<D>(cache: Map<string, D>, version: string, docs: D): void {
  if (cache.size >= DOCS_CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(version, docs);
}

async function fetchAndLoad<D>(
  requested: string,
  source: ReleaseAssetSource<D>,
  cache: Map<string, D>,
): Promise<ReleaseResolution<D>> {
  const cached = readCached(requested, source);
  if (cached !== undefined) {
    cacheDocs(cache, requested, cached);
    return { ok: true, docs: cached, version: source.versionOf(cached) ?? requested };
  }
  if (source.offline) {
    return { ok: false, reason: 'asset-missing', message: `v${requested} is not cached and --offline forbids a fetch.` };
  }
  const fetched = await source.fetch(requested);
  if (!fetched.ok) {
    return { ok: false, reason: fetched.reason, message: fetched.message };
  }
  try {
    const docs = source.load(fetched.path);
    // Written only after the load succeeded, so a schema mismatch is never cached.
    source.cache?.write(requested, fetched.path);
    cacheDocs(cache, requested, docs);
    // A successful download of the `v<version>` asset means the asset IS that version,
    // so an unstamped raw export still resolves to the requested label.
    return { ok: true, docs, version: source.versionOf(docs) ?? requested };
  } catch (error) {
    return {
      ok: false,
      reason: 'asset-missing',
      message: `Fetched ${source.label} for v${requested} could not be read: ${fetchedLoadProblem(error)}`,
    };
  } finally {
    // The parsed index lives in memory from here on; the file on disk is never read again.
    if (fetched.dir !== undefined) {
      removeQuietly(source.removeDir ?? removeTempDir, fetched.dir);
    }
  }
}

/** The disk-cached asset of `requested`, or undefined. An entry that fails to load is discarded, so the caller refetches once. */
function readCached<D>(requested: string, source: ReleaseAssetSource<D>): D | undefined {
  const path = source.cache?.read(requested);
  if (!source.cache || !path) {
    return undefined;
  }
  try {
    return source.load(path);
  } catch (error) {
    source.cache.discard(requested, fetchedLoadProblem(error));
    return undefined;
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
export async function answerVersioned<T, D = DocsIndex>(
  resolve: ReleaseResolver<D>,
  version: string | undefined,
  query: (docs: D) => T,
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

/** Why a fetched asset failed to load. The reinstall hint is dropped: it repairs the bundled snapshot, not a release asset. */
function fetchedLoadProblem(error: unknown): string {
  if (error instanceof SnapshotLoadError) {
    return error.problem;
  }
  return error instanceof Error ? error.message : String(error);
}
