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
  'existsSync' | 'mkdirSync' | 'copyFileSync' | 'renameSync' | 'rmSync' | 'rmdirSync' | 'readdirSync' | 'statSync' | 'utimesSync'
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

/** A temp file this old belongs to a writer that crashed: no live copy takes this long. */
const STALE_TEMP_MS = 10 * 60 * 1000;

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

  /**
   * Remove the temp files a crashed writer left in `version`'s directory, and the
   * directory itself when that leaves it empty. A fresh temp file is a live writer's.
   * Best effort: a failure leaves the leftovers for the next write and never stops
   * the eviction of the other versions.
   */
  function sweepStaleTemps(version: string): void {
    const versionDir = path.join(snapshots, version);
    try {
      let removed = 0;
      const names = fs.readdirSync(versionDir);
      for (const name of names) {
        const file = path.join(versionDir, name);
        if (name.endsWith('.tmp') && now().getTime() - fs.statSync(file).mtimeMs > STALE_TEMP_MS) {
          fs.rmSync(file, { force: true });
          removed++;
        }
      }
      if (removed > 0 && removed === names.length) {
        // Not recursive: a writer that renamed its entry in since the listing keeps it.
        fs.rmdirSync(versionDir);
      }
    } catch {
      // Swept or evicted by another process, a live writer's directory, or unreadable.
    }
  }

  function evict(): void {
    const entries: { version: string; mtimeMs: number }[] = [];
    for (const version of fs.readdirSync(snapshots)) {
      if (!isReleaseVersion(version)) {
        continue;
      }
      sweepStaleTemps(version);
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
 * `%LOCALAPPDATA%\cngx\Cache` on win32, `~/.cache/cngx` elsewhere). An empty or
 * relative variable is ignored: it would put a cache into every working directory.
 * `home` is called only when a variable does not decide; null (no home directory,
 * as for an arbitrary uid in a container) means no disk cache at all.
 */
export function resolveCacheDir(
  env: Readonly<Record<string, string | undefined>>,
  platform: NodeJS.Platform,
  home: () => string | null,
  path: PlatformPath = platform === 'win32' ? nodePath.win32 : nodePath.posix,
): string | null {
  const absolute = (value: string | undefined) => (value && path.isAbsolute(value) ? value : undefined);
  const cngxCacheDir = absolute(env.CNGX_CACHE_DIR);
  if (cngxCacheDir) {
    return cngxCacheDir;
  }
  const xdgCacheHome = absolute(env.XDG_CACHE_HOME);
  if (xdgCacheHome) {
    return path.join(xdgCacheHome, 'cngx');
  }
  const localAppData = absolute(env.LOCALAPPDATA);
  if (platform === 'win32' && localAppData) {
    return path.join(localAppData, 'cngx', 'Cache');
  }
  const homeDir = home();
  if (homeDir === null) {
    return null;
  }
  if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Caches', 'cngx');
  }
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Local', 'cngx', 'Cache');
  }
  return path.join(homeDir, '.cache', 'cngx');
}
