import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createDocsIndex, loadDocsFromFile, SchemaVersionError } from './loader.js';
import type { DocsResolverDeps } from './docs-resolver.js';
import { answerVersioned, createDocsResolver, DOCS_CACHE_LIMIT } from './docs-resolver.js';
import { fetchSnapshot } from '../diff/snapshot-fetch.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';

const SAMPLE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

const bundled = loadDocsFromFile(SAMPLE); // cngxVersion 0.1.0-rc.6

describe('createDocsResolver', () => {
  it('short-circuits to the bundled snapshot with no fetch when version is absent', async () => {
    const fetchSnapshot = vi.fn();
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile })(undefined);

    expect(resolution).toEqual({ ok: true, docs: bundled, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('short-circuits with no fetch when version equals the bundled cngxVersion', async () => {
    const fetchSnapshot = vi.fn();
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile })('0.1.0-rc.6');

    expect(resolution).toMatchObject({ ok: true, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it.each([[''], ['  ']])('does not answer a blank version %j with the bundled snapshot', async (blank) => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: false, reason: 'asset-missing', message: 'absent' }));
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile })(blank);

    expect(resolution).toMatchObject({ ok: false, reason: 'invalid-version' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('answers a leading v like the bare version', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: false, reason: 'asset-missing', message: 'absent' }));
    const resolve = createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile });

    expect(await resolve('v0.1.0-rc.6')).toEqual({ ok: true, docs: bundled, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
    await resolve('v0.2.0');
    expect(fetchSnapshot).toHaveBeenCalledWith('0.2.0');
  });

  it('strips one leading v only and rejects a second one before any fetch', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: false, reason: 'asset-missing', message: 'absent' }));
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile })('vv0.2.0');

    expect(resolution).toMatchObject({ ok: false, reason: 'invalid-version', message: expect.stringMatching(/^"vv0\.2\.0" is not a release version/) });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('strips an upper-case V like a lower-case one', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: false, reason: 'asset-missing', message: 'absent' }));
    await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile })('V0.2.0');

    expect(fetchSnapshot).toHaveBeenCalledWith('0.2.0');
  });

  it('fetches a non-bundled version once and serves the second call from cache', async () => {
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW }));
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const resolve = createDocsResolver(bundled, deps);

    const first = await resolve('0.2.0');
    const second = await resolve('0.2.0');

    expect(first).toMatchObject({ ok: true, version: '0.2.0' });
    expect(second).toMatchObject({ ok: true, version: '0.2.0' });
    // The fetched DocsIndex is reused verbatim on the cache hit.
    expect((second as { docs: unknown }).docs).toBe((first as { docs: unknown }).docs);
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it('shares one fetch between concurrent requests for the same version', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const fetchSnapshot = vi.fn(async () => {
      await gate;
      return { ok: true as const, path: NEW };
    });
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const resolve = createDocsResolver(bundled, deps);

    const both = Promise.all([resolve('0.2.0'), resolve('0.2.0')]);
    release();
    const [first, second] = await both;

    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('fetches again after a failed fetch instead of replaying the failure', async () => {
    const fetchSnapshot = vi
      .fn<DocsResolverDeps['fetchSnapshot']>()
      .mockResolvedValueOnce({ ok: false, reason: 'network', message: 'offline' })
      .mockResolvedValueOnce({ ok: true, path: NEW });
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const resolve = createDocsResolver(bundled, deps);

    expect(await resolve('0.2.0')).toMatchObject({ ok: false, reason: 'network' });
    expect(await resolve('0.2.0')).toMatchObject({ ok: true, version: '0.2.0' });
    expect(fetchSnapshot).toHaveBeenCalledTimes(2);
  });

  it('keeps each resolver\'s cache to itself', async () => {
    const realFetch = vi.fn(async () => ({ ok: true as const, path: NEW }));
    const failingFetch = vi.fn(async () => ({ ok: false as const, reason: 'network' as const, message: 'offline' }));

    expect(await createDocsResolver(bundled, { fetchSnapshot: realFetch, loadDocs: loadDocsFromFile })('0.2.0')).toMatchObject({
      ok: true,
    });
    const isolated = createDocsResolver(bundled, { fetchSnapshot: failingFetch, loadDocs: loadDocsFromFile });

    expect(await isolated('0.2.0')).toMatchObject({ ok: false, reason: 'network' });
    expect(failingFetch).toHaveBeenCalledTimes(1);
  });

  it('maps a SchemaVersionError from the fetched snapshot to asset-missing', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: '/tmp/wrong-schema.json' }),
      loadDocs: () => {
        throw new SchemaVersionError(3);
      },
    };

    const resolution = await createDocsResolver(bundled, deps)('0.2.0');

    expect(resolution).toEqual({
      ok: false,
      reason: 'asset-missing',
      message: 'Fetched snapshot for v0.2.0 could not be read: Malformed documentation.json: schemaVersion 3; this package reads 2 and 6',
    });
  });

  it.each<SnapshotFetchFailureReason>(['gh-missing', 'network', 'asset-missing'])(
    'passes the %s fetch failure through untouched',
    async (reason) => {
      const deps: DocsResolverDeps = {
        fetchSnapshot: async () => ({ ok: false, reason, message: `${reason} detail` }),
        loadDocs: loadDocsFromFile,
      };

      const resolution = await createDocsResolver(bundled, deps)('9.9.9');

      expect(resolution).toEqual({ ok: false, reason, message: `${reason} detail` });
    },
  );

  it.each(['../x', '1.0/../..', 'latest', '01.2.3', '1.2.3-.', '1.2.3-rc.'])(
    'rejects the non-release version %s as invalid-version before any fetch',
    async (version) => {
      const loadDocs = vi.fn(loadDocsFromFile);
      const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs })(version);

      expect(resolution).toMatchObject({
        ok: false,
        reason: 'invalid-version',
        message: expect.stringContaining('not a release version'),
      });
      expect(loadDocs).not.toHaveBeenCalled();
    },
  );

  it('bounds the cache to DOCS_CACHE_LIMIT, evicting the oldest entry', async () => {
    const fetchCounts = new Map<string, number>();
    const deps: DocsResolverDeps = {
      fetchSnapshot: async (v) => {
        fetchCounts.set(v, (fetchCounts.get(v) ?? 0) + 1);
        return { ok: true, path: NEW };
      },
      loadDocs: loadDocsFromFile,
    };

    const resolve = createDocsResolver(bundled, deps);

    // One past capacity: "9.0.0" .. "9.<LIMIT>.0" is LIMIT+1 distinct versions.
    for (let i = 0; i <= DOCS_CACHE_LIMIT; i++) {
      await resolve(`9.${i}.0`);
    }

    // The most-recent version stays cached: a re-query does not re-fetch.
    await resolve(`9.${DOCS_CACHE_LIMIT}.0`);
    expect(fetchCounts.get(`9.${DOCS_CACHE_LIMIT}.0`)).toBe(1);

    // The oldest version was evicted: a re-query fetches it a second time.
    await resolve('9.0.0');
    expect(fetchCounts.get('9.0.0')).toBe(2);
  });
});

describe('createDocsResolver fetched temp dir', () => {
  const DIR = '/tmp/cngx-snapshot-test';

  it('removes the fetched dir once the snapshot is loaded', async () => {
    const removeDir = vi.fn();
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW, dir: DIR }));

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir })('0.2.0');

    expect(resolution).toMatchObject({ ok: true, version: '0.2.0' });
    expect(removeDir).toHaveBeenCalledWith(DIR);
  });

  it('removes the fetched dir when the snapshot fails to load', async () => {
    const removeDir = vi.fn();
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW, dir: DIR }));
    const loadDocs = vi.fn(() => {
      throw new SchemaVersionError(99);
    });

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs, removeDir })('0.2.0');

    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect(removeDir).toHaveBeenCalledWith(DIR);
  });

  it('answers ok when the removal itself throws', async () => {
    const removeDir = vi.fn(() => {
      throw new Error('EBUSY');
    });
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW, dir: DIR }));

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir })('0.2.0');

    expect(resolution).toMatchObject({ ok: true, version: '0.2.0' });
  });

  it('removes nothing when the fetch hands over no dir', async () => {
    const removeDir = vi.fn();
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW }));

    await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir })('0.2.0');

    expect(removeDir).not.toHaveBeenCalled();
  });
});

describe('createDocsResolver cache and offline', () => {
  const cacheOf = (path: string | null): NonNullable<DocsResolverDeps['cache']> => ({
    read: vi.fn(() => path),
    write: vi.fn(),
    discard: vi.fn(),
  });

  it('answers a disk-cache hit without fetching', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>();
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache: cacheOf(NEW) })('0.2.0');

    expect(resolution).toMatchObject({ ok: true, version: '0.2.0' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('writes a fetched snapshot to the disk cache after it loaded', async () => {
    const cache = cacheOf(null);
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: NEW }));

    await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache })('0.2.0');

    expect(cache.write).toHaveBeenCalledWith('0.2.0', NEW);
  });

  it('does not write a fetched snapshot with an unknown schema', async () => {
    const cache = cacheOf(null);
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: NEW }));
    const loadDocs = vi.fn(() => {
      throw new SchemaVersionError(99);
    });

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs, cache })('0.2.0');

    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect(cache.write).not.toHaveBeenCalled();
  });

  it('offline: answers a cache hit and never fetches', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>();
    const resolve = createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache: cacheOf(NEW), offline: true });

    expect(await resolve('0.2.0')).toMatchObject({ ok: true, version: '0.2.0' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('offline: answers an uncached version as a failure naming --offline, never another release', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>();
    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, cache: cacheOf(null), offline: true })('0.2.0');

    expect(resolution).toEqual({ ok: false, reason: 'asset-missing', message: 'v0.2.0 is not cached and --offline forbids a fetch.' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('offline: discards a corrupt entry and does not refetch', async () => {
    const cache = cacheOf(NEW);
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>();
    const loadDocs = vi.fn(() => {
      throw new SchemaVersionError(99);
    });

    const resolution = await createDocsResolver(bundled, { fetchSnapshot, loadDocs, cache, offline: true })('0.2.0');

    expect(cache.discard).toHaveBeenCalledWith('0.2.0', expect.any(String));
    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('offline: still answers the bundled version with no cache read', async () => {
    const cache = cacheOf(null);
    const resolution = await createDocsResolver(bundled, { fetchSnapshot: vi.fn(), loadDocs: loadDocsFromFile, cache, offline: true })('0.1.0-rc.6');

    expect(resolution).toMatchObject({ ok: true, version: '0.1.0-rc.6' });
    expect(cache.read).not.toHaveBeenCalled();
  });
});

describe('createDocsResolver example urls', () => {
  it('answers a fetched release snapshot with public example urls', async () => {
    const raw = createDocsIndex({
      schemaVersion: 6,
      cngxVersion: '0.2.0',
      injectables: [{ name: 'CngxToaster', exampleUrls: ['http://localhost:4200/#/ui/feedback/toast/basic'] }],
    });
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: 'unused' }), loadDocs: () => raw };

    const resolution = await createDocsResolver(bundled, deps)('0.2.0');

    expect(resolution.ok && resolution.docs.injectables[0].exampleUrls).toEqual([
      'https://cngxjs.github.io/cngx/examples/#/ui/feedback/toast/basic',
    ]);
  });
});

describe('answerVersioned', () => {
  it('wraps a bundled answer with ok: true and the bundled groundedVersion', async () => {
    const answer = await answerVersioned(createDocsResolver(bundled), undefined, (docs) => docs.components.length);

    expect(answer).toEqual({ ok: true, groundedVersion: '0.1.0-rc.6', result: bundled.components.length });
  });

  it('grounds the query against a fetched non-bundled snapshot', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = await answerVersioned(createDocsResolver(bundled, deps), '0.2.0', (docs) => docs.meta.cngxVersion);

    expect(answer).toEqual({ ok: true, groundedVersion: '0.2.0', result: '0.2.0' });
  });

  it('returns the typed failure instead of running the query on a fetch failure', async () => {
    const query = vi.fn();
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = await answerVersioned(createDocsResolver(bundled, deps), '9.9.9', query);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
    expect(query).not.toHaveBeenCalled();
  });

  it('surfaces a throwing query as a typed failure, never a throw across the boundary', async () => {
    const answer = await answerVersioned(createDocsResolver(bundled), undefined, () => {
      throw new Error('boom');
    });

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'internal: boom' });
  });

  it('surfaces a throwing resolver as a typed failure', async () => {
    const query = vi.fn();
    const answer = await answerVersioned(
      async () => {
        throw new Error('EACCES: temp dir');
      },
      '0.2.0',
      query,
    );

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'internal: EACCES: temp dir' });
    expect(query).not.toHaveBeenCalled();
  });
});
