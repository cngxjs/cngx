// Expectations encode the disk-cache rows of the "Snapshot source" matrix in
// cngx-cli-core-phase-4-plan.md and its disk-cache decision row.

import * as fs from 'node:fs';
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocsResolverDeps } from './docs-resolver.js';
import { createDocsResolver, DOCS_CACHE_LIMIT } from './docs-resolver.js';
import { loadDocsFromFile } from './loader.js';
import type { SnapshotCacheFs } from './snapshot-cache.js';
import { createSnapshotCache, resolveCacheDir } from './snapshot-cache.js';

const SAMPLE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

const bundled = loadDocsFromFile(SAMPLE); // cngxVersion 0.1.0-rc.6

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'cngx-cache-spec-'));
});

afterEach(() => {
  chmodSync(root, 0o700);
  rmSync(root, { recursive: true, force: true });
});

const versions = (n: number) => Array.from({ length: n }, (_, i) => `0.${i + 1}.0`);

describe('resolveCacheDir', () => {
  it('prefers CNGX_CACHE_DIR over everything', () => {
    expect(resolveCacheDir({ CNGX_CACHE_DIR: '/c', XDG_CACHE_HOME: '/x' }, 'darwin', () => '/home/u')).toBe('/c');
  });

  it('uses $XDG_CACHE_HOME/cngx next', () => {
    expect(resolveCacheDir({ XDG_CACHE_HOME: '/x' }, 'darwin', () => '/home/u')).toBe('/x/cngx');
  });

  it.each<[NodeJS.Platform, string]>([
    ['darwin', '/home/u/Library/Caches/cngx'],
    ['linux', '/home/u/.cache/cngx'],
    ['freebsd', '/home/u/.cache/cngx'],
  ])('falls back to the %s cache directory', (platform, expected) => {
    expect(resolveCacheDir({}, platform, () => '/home/u')).toBe(expected);
  });

  it('uses %LOCALAPPDATA%\\cngx\\Cache on win32, joined with path.win32', () => {
    expect(resolveCacheDir({ LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' }, 'win32', () => 'C:\\Users\\u')).toBe(
      'C:\\Users\\u\\AppData\\Local\\cngx\\Cache',
    );
    expect(resolveCacheDir({}, 'win32', () => 'C:\\Users\\u')).toBe('C:\\Users\\u\\AppData\\Local\\cngx\\Cache');
  });

  it.each([
    [{ CNGX_CACHE_DIR: 'cache' }, '/home/u/.cache/cngx'],
    [{ CNGX_CACHE_DIR: './cache', XDG_CACHE_HOME: '/x' }, '/x/cngx'],
    [{ XDG_CACHE_HOME: '.cache' }, '/home/u/.cache/cngx'],
  ])('ignores a relative cache variable %j', (env, expected) => {
    expect(resolveCacheDir(env, 'linux', () => '/home/u')).toBe(expected);
  });

  it('ignores a relative LOCALAPPDATA on win32', () => {
    expect(resolveCacheDir({ LOCALAPPDATA: 'AppData\\Local' }, 'win32', () => 'C:\\Users\\u')).toBe('C:\\Users\\u\\AppData\\Local\\cngx\\Cache');
  });

  it('reads the home directory only when no variable decides, and gives no cache without one', () => {
    const home = vi.fn(() => null);

    expect(resolveCacheDir({ CNGX_CACHE_DIR: '/c' }, 'linux', home)).toBe('/c');
    expect(resolveCacheDir({ XDG_CACHE_HOME: '/x' }, 'linux', home)).toBe('/x/cngx');
    expect(home).not.toHaveBeenCalled();
    expect(resolveCacheDir({}, 'linux', home)).toBeNull();
  });

  it('ignores an empty CNGX_CACHE_DIR', () => {
    expect(resolveCacheDir({ CNGX_CACHE_DIR: '' }, 'linux', () => '/home/u')).toBe('/home/u/.cache/cngx');
  });

  it('ignores an empty LOCALAPPDATA on win32 instead of resolving under cwd', () => {
    expect(resolveCacheDir({ LOCALAPPDATA: '' }, 'win32', () => 'C:\\Users\\u')).toBe('C:\\Users\\u\\AppData\\Local\\cngx\\Cache');
  });
});

describe('createSnapshotCache', () => {
  it('misses, then hits after a write', () => {
    const cache = createSnapshotCache({ dir: root });

    expect(cache.read('0.2.0')).toBeNull();
    cache.write('0.2.0', NEW);

    const hit = cache.read('0.2.0');
    expect(hit).toBe(join(root, 'snapshots', '0.2.0', 'documentation.json'));
    expect(readFileSync(hit!, 'utf8')).toBe(readFileSync(NEW, 'utf8'));
  });

  it('evicts the least recently read entry when the 17th is written', () => {
    let clock = 1_000_000;
    const cache = createSnapshotCache({ dir: root, now: () => new Date((clock += 1000)) });
    const all = versions(DOCS_CACHE_LIMIT + 1);
    for (const version of all.slice(0, DOCS_CACHE_LIMIT)) {
      cache.write(version, NEW);
      const at = new Date((clock += 1000));
      utimesSync(join(root, 'snapshots', version, 'documentation.json'), at, at);
    }
    // Reading the oldest makes it the most recent; the second-oldest goes instead.
    expect(cache.read(all[0])).not.toBeNull();

    cache.write(all[DOCS_CACHE_LIMIT], NEW);

    const kept = readdirSync(join(root, 'snapshots')).sort();
    expect(kept).toHaveLength(DOCS_CACHE_LIMIT);
    expect(kept).toContain(all[0]);
    expect(kept).not.toContain(all[1]);
  });

  it('answers without caching and warns once when the dir is not writable', () => {
    chmodSync(root, 0o500);
    const warn = vi.fn();
    const cache = createSnapshotCache({ dir: root, warn });

    expect(() => cache.write('0.2.0', NEW)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/^cngx: could not cache the v0\.2\.0 snapshot in /);
    expect(cache.read('0.2.0')).toBeNull();
  });

  it.each(['../x', '1.0/../..', 'latest', '..', ''])('never builds a path from the invalid version %j', (version) => {
    const join = vi.fn(path.join);
    const cache = createSnapshotCache({ dir: root, path: { ...path, join } });
    join.mockClear();

    expect(cache.read(version)).toBeNull();
    cache.write(version, NEW);
    cache.discard(version, 'x');

    expect(join).not.toHaveBeenCalled();
    expect(readdirSync(root)).toEqual([]);
  });

  it('builds every path through the injected path module', () => {
    const join = vi.fn(path.join);
    createSnapshotCache({ dir: root, path: { ...path, join } }).read('0.2.0');

    expect(join).toHaveBeenCalled();
  });

  it('discards an entry with one warning naming the problem', () => {
    const warn = vi.fn();
    const cache = createSnapshotCache({ dir: root, warn });
    cache.write('0.2.0', NEW);

    cache.discard('0.2.0', 'Malformed documentation.json: Unexpected token');

    expect(cache.read('0.2.0')).toBeNull();
    expect(warn).toHaveBeenCalledWith('cngx: removed the unreadable cached v0.2.0 snapshot (Malformed documentation.json: Unexpected token)');
  });

  it('deletes nothing outside its snapshots directory', () => {
    writeFileSync(join(root, 'keep.txt'), 'x');
    fs.mkdirSync(join(root, 'snapshots', 'not-a-version'), { recursive: true });
    const cache = createSnapshotCache({ dir: root, limit: 0 });

    cache.write('0.2.0', NEW);

    expect(existsSync(join(root, 'keep.txt'))).toBe(true);
    expect(existsSync(join(root, 'snapshots', 'not-a-version'))).toBe(true);
  });
});

describe('createSnapshotCache concurrency', () => {
  it('interleaves two writers and evictors on one dir without a partial file or a throw', () => {
    const a = createSnapshotCache({ dir: root, limit: 4 });
    const b = createSnapshotCache({ dir: root, limit: 4 });
    const all = versions(12);

    all.forEach((version, i) => (i % 2 === 0 ? a : b).write(version, NEW));
    a.write(all[11], NEW);

    const expected = readFileSync(NEW, 'utf8');
    for (const version of readdirSync(join(root, 'snapshots'))) {
      const files = readdirSync(join(root, 'snapshots', version));
      expect(files).toEqual(['documentation.json']);
      expect(readFileSync(join(root, 'snapshots', version, 'documentation.json'), 'utf8')).toBe(expected);
    }
  });

  it('keeps the entry and says only eviction failed when the eviction throws', () => {
    const warn = vi.fn();
    const failing: SnapshotCacheFs = {
      ...fs,
      readdirSync: (() => {
        throw new Error('EACCES: listing denied');
      }) as unknown as typeof fs.readdirSync,
    };
    const cache = createSnapshotCache({ dir: root, fs: failing, warn });

    cache.write('0.2.0', NEW);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/^cngx: cached the v0\.2\.0 snapshot but could not evict old entries in .*EACCES: listing denied$/);
    expect(cache.read('0.2.0')).not.toBeNull();
  });

  it('ignores an entry another process evicted between listing and stat', () => {
    const warn = vi.fn();
    const seed = createSnapshotCache({ dir: root });
    seed.write('0.1.0', NEW);
    const racing: SnapshotCacheFs = {
      ...fs,
      statSync: ((file: fs.PathLike) => {
        if (String(file).includes(`${path.sep}0.1.0${path.sep}`)) {
          rmSync(join(root, 'snapshots', '0.1.0'), { recursive: true, force: true });
        }
        return fs.statSync(file);
      }) as typeof fs.statSync,
    };

    createSnapshotCache({ dir: root, fs: racing, warn }).write('0.2.0', NEW);

    expect(warn).not.toHaveBeenCalled();
    expect(readdirSync(join(root, 'snapshots'))).toEqual(['0.2.0']);
  });
});

describe('createDocsResolver with a disk cache', () => {
  it('serves a second resolver from disk with no fetch', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: NEW }));
    const deps = () => ({ fetchSnapshot, loadDocs: loadDocsFromFile, cache: createSnapshotCache({ dir: root }) });

    await createDocsResolver(bundled, deps())('0.2.0');
    const second = await createDocsResolver(bundled, deps())('0.2.0');

    expect(second).toMatchObject({ ok: true, version: '0.2.0' });
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it('removes a corrupt entry and refetches once', async () => {
    const warn = vi.fn();
    const cache = createSnapshotCache({ dir: root, warn });
    cache.write('0.2.0', NEW);
    writeFileSync(join(root, 'snapshots', '0.2.0', 'documentation.json'), '{ not json');
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: NEW }));

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache })('0.2.0');

    expect(resolution).toMatchObject({ ok: true, version: '0.2.0' });
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^cngx: removed the unreadable cached v0\.2\.0 snapshot \(/));
    expect(readFileSync(cache.read('0.2.0')!, 'utf8')).toBe(readFileSync(NEW, 'utf8'));
  });

  it('never caches a fetched snapshot that fails to load', async () => {
    const bad = join(root, 'bad.json');
    writeFileSync(bad, JSON.stringify({ schemaVersion: 99 }));
    const cache = createSnapshotCache({ dir: join(root, 'cache') });
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: bad }));

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache })('0.2.0');

    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect(cache.read('0.2.0')).toBeNull();
  });

  it('rejects an invalid version before the cache builds a path', async () => {
    const join = vi.fn(path.join);
    const cache = createSnapshotCache({ dir: root, path: { ...path, join } });
    join.mockClear();
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>();

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache })('../x');

    expect(resolution).toMatchObject({ ok: false, reason: 'invalid-version' });
    expect(join).not.toHaveBeenCalled();
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('leaves no fetch temp dir behind after a cached fetch', async () => {
    const tempDirs: string[] = [];
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => {
      const dir = mkdtempSync(join(root, 'cngx-snapshot-'));
      tempDirs.push(dir);
      copyFileSync(NEW, join(dir, 'documentation.json'));
      return { ok: true, path: join(dir, 'documentation.json'), dir };
    });
    const cache = createSnapshotCache({ dir: join(root, 'cache') });

    await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache })('0.2.0');

    expect(tempDirs).toHaveLength(1);
    expect(existsSync(tempDirs[0])).toBe(false);
    expect(cache.read('0.2.0')).not.toBeNull();
  });
});
