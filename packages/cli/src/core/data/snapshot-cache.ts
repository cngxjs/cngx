// Disk cache for fetched release snapshots. A one-shot process (the CLI) would
// otherwise download the same release asset on every call; the resolver reads
// this cache before it fetches and writes a snapshot only after it loaded.
// Release tags are immutable, so an entry never goes stale; the bound evicts the
// least recently read entries by mtime. A version reaches a path only after
// `isReleaseVersion`, every path is built through the injected `path`, and the
// cache only ever deletes inside its own `snapshots/` directory. Nothing here
// throws: a cache that cannot write answers without caching and says so once.

import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import type { PlatformPath } from 'node:path';
import { isReleaseVersion } from '../diff/snapshot-fetch.js';
import { DOCS_CACHE_LIMIT } from './docs-resolver.js';

/** The `node:fs` calls the cache makes; injected so specs can plant failures. */
export type SnapshotCacheFs = Pick<
  typeof nodeFs,
  'existsSync' | 'mkdirSync' | 'copyFileSync' | 'renameSync' | 'rmSync' | 'readdirSync' | 'statSync' | 'utimesSync'
>;

export interface SnapshotCacheOptions {
  /** The cache root; entries live under `<dir>/snapshots/<version>/documentation.json`. */
  readonly dir: string;
  readonly fs?: SnapshotCacheFs;
  readonly path?: PlatformPath;
  readonly now?: () => Date;
  /** One diagnostic line per call; the CLI writes it to stderr. */
  readonly warn?: (message: string) => void;
  /** Entries kept after a write. Defaults to {@link DOCS_CACHE_LIMIT}. */
  readonly limit?: number;
}

export interface SnapshotCache {
  /** The cached snapshot file of `version`, or null. A hit counts as a read for eviction. */
  read(version: string): string | null;
  /** Copy the snapshot at `sourcePath` into the cache under `version`, then evict beyond the bound. */
  write(version: string, sourcePath: string): void;
  /** Drop an entry that failed to load, with one diagnostic naming why. */
  discard(version: string, problem: string): void;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const isEnoent = (error: unknown) => (error as NodeJS.ErrnoException | null)?.code === 'ENOENT';

export function createSnapshotCache({
  dir,
  fs = nodeFs,
  path = nodePath,
  now = () => new Date(),
  warn = () => undefined,
  limit = DOCS_CACHE_LIMIT,
}: SnapshotCacheOptions): SnapshotCache {
  const snapshots = path.join(dir, 'snapshots');
  const fileOf = (version: string) => path.join(snapshots, version, 'documentation.json');

  const removeEntry = (version: string) => fs.rmSync(path.join(snapshots, version), { recursive: true, force: true });

  function evict(): void {
    const entries: { version: string; mtimeMs: number }[] = [];
    for (const version of fs.readdirSync(snapshots)) {
      if (!isReleaseVersion(version)) {
        continue;
      }
      try {
        entries.push({ version, mtimeMs: fs.statSync(fileOf(version)).mtimeMs });
      } catch (error) {
        // Another process evicted it, or its write has not been renamed yet.
        if (!isEnoent(error)) {
          throw error;
        }
      }
    }
    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const { version } of entries.slice(limit)) {
      removeEntry(version);
    }
  }

  return {
    read(version) {
      if (!isReleaseVersion(version)) {
        return null;
      }
      const file = fileOf(version);
      if (!fs.existsSync(file)) {
        return null;
      }
      try {
        const at = now();
        fs.utimesSync(file, at, at);
      } catch {
        // A read-only cache still answers; only the eviction order goes stale.
      }
      return file;
    },

    write(version, sourcePath) {
      if (!isReleaseVersion(version)) {
        return;
      }
      const versionDir = path.join(snapshots, version);
      // A unique temp name per writer, renamed into place, so a concurrent reader
      // sees either no file or a whole one.
      const temp = path.join(versionDir, `documentation.json.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`);
      try {
        fs.mkdirSync(versionDir, { recursive: true });
        fs.copyFileSync(sourcePath, temp);
        fs.renameSync(temp, fileOf(version));
      } catch (error) {
        try {
          fs.rmSync(temp, { force: true });
        } catch {
          // Nothing left to report beyond the warning below.
        }
        warn(`cngx: could not cache the v${version} snapshot in ${dir}: ${errorMessage(error)}`);
        return;
      }
      // The entry is in place; a failed eviction only lets the cache grow past its bound.
      try {
        evict();
      } catch (error) {
        warn(`cngx: cached the v${version} snapshot but could not evict old entries in ${dir}: ${errorMessage(error)}`);
      }
    },

    discard(version, problem) {
      if (!isReleaseVersion(version)) {
        return;
      }
      try {
        removeEntry(version);
        warn(`cngx: removed the unreadable cached v${version} snapshot (${problem})`);
      } catch (error) {
        warn(`cngx: could not remove the unreadable cached v${version} snapshot: ${errorMessage(error)}`);
      }
    },
  };
}

/**
 * The cache root: `CNGX_CACHE_DIR`, else `$XDG_CACHE_HOME/cngx`, else the
 * platform cache directory (`~/Library/Caches/cngx` on darwin,
 * `%LOCALAPPDATA%\cngx\Cache` on win32, `~/.cache/cngx` elsewhere).
 */
export function resolveCacheDir(
  env: Readonly<Record<string, string | undefined>>,
  platform: NodeJS.Platform,
  home: string,
  path: PlatformPath = platform === 'win32' ? nodePath.win32 : nodePath.posix,
): string {
  if (env.CNGX_CACHE_DIR) {
    return env.CNGX_CACHE_DIR;
  }
  if (env.XDG_CACHE_HOME) {
    return path.join(env.XDG_CACHE_HOME, 'cngx');
  }
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Caches', 'cngx');
  }
  if (platform === 'win32' && env.LOCALAPPDATA) {
    return path.join(env.LOCALAPPDATA, 'cngx', 'Cache');
  }
  if (platform === 'win32') {
    return path.join(home, 'AppData', 'Local', 'cngx', 'Cache');
  }
  return path.join(home, '.cache', 'cngx');
}
