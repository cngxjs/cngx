import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDocsFromFile, SchemaVersionError } from './loader.js';
import type { DocsResolverDeps } from './docs-resolver.js';
import { answerVersioned, DOCS_CACHE_LIMIT, resetDocsCache, resolveDocs } from './docs-resolver.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';

const SAMPLE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

const bundled = loadDocsFromFile(SAMPLE); // cngxVersion 0.1.0-rc.6

beforeEach(() => {
  resetDocsCache();
});

describe('resolveDocs', () => {
  it('short-circuits to the bundled snapshot with no fetch when version is absent', async () => {
    const fetchSnapshot = vi.fn();
    const resolution = await resolveDocs(bundled, undefined, { fetchSnapshot, loadDocs: loadDocsFromFile });

    expect(resolution).toEqual({ ok: true, docs: bundled, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('short-circuits with no fetch when version equals the bundled cngxVersion', async () => {
    const fetchSnapshot = vi.fn();
    const resolution = await resolveDocs(bundled, '0.1.0-rc.6', { fetchSnapshot, loadDocs: loadDocsFromFile });

    expect(resolution).toMatchObject({ ok: true, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('fetches a non-bundled version once and serves the second call from cache', async () => {
    const fetchSnapshot = vi.fn(async () => ({ ok: true as const, path: NEW }));
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const first = await resolveDocs(bundled, '0.2.0', deps);
    const second = await resolveDocs(bundled, '0.2.0', deps);

    expect(first).toMatchObject({ ok: true, version: '0.2.0' });
    expect(second).toMatchObject({ ok: true, version: '0.2.0' });
    // The fetched DocsIndex is reused verbatim on the cache hit.
    expect((second as { docs: unknown }).docs).toBe((first as { docs: unknown }).docs);
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it('maps a SchemaVersionError from the fetched snapshot to asset-missing', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: '/tmp/wrong-schema.json' }),
      loadDocs: () => {
        throw new SchemaVersionError(3, 2);
      },
    };

    const resolution = await resolveDocs(bundled, '0.2.0', deps);

    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it.each<SnapshotFetchFailureReason>(['gh-missing', 'network', 'asset-missing'])(
    'passes the %s fetch failure through untouched',
    async (reason) => {
      const deps: DocsResolverDeps = {
        fetchSnapshot: async () => ({ ok: false, reason, message: `${reason} detail` }),
        loadDocs: loadDocsFromFile,
      };

      const resolution = await resolveDocs(bundled, '9.9.9', deps);

      expect(resolution).toEqual({ ok: false, reason, message: `${reason} detail` });
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

    // One past capacity: "9.0.0" .. "9.<LIMIT>.0" is LIMIT+1 distinct versions.
    for (let i = 0; i <= DOCS_CACHE_LIMIT; i++) {
      await resolveDocs(bundled, `9.${i}.0`, deps);
    }

    // The most-recent version stays cached: a re-query does not re-fetch.
    await resolveDocs(bundled, `9.${DOCS_CACHE_LIMIT}.0`, deps);
    expect(fetchCounts.get(`9.${DOCS_CACHE_LIMIT}.0`)).toBe(1);

    // The oldest version was evicted: a re-query fetches it a second time.
    await resolveDocs(bundled, '9.0.0', deps);
    expect(fetchCounts.get('9.0.0')).toBe(2);
  });
});

describe('answerVersioned', () => {
  it('wraps a bundled answer with ok: true and the bundled groundedVersion', async () => {
    const answer = await answerVersioned(bundled, undefined, (docs) => docs.components.length);

    expect(answer).toEqual({ ok: true, groundedVersion: '0.1.0-rc.6', result: bundled.components.length });
  });

  it('grounds the query against a fetched non-bundled snapshot', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = await answerVersioned(bundled, '0.2.0', (docs) => docs.meta.cngxVersion, deps);

    expect(answer).toEqual({ ok: true, groundedVersion: '0.2.0', result: '0.2.0' });
  });

  it('returns the typed failure instead of running the query on a fetch failure', async () => {
    const query = vi.fn();
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = await answerVersioned(bundled, '9.9.9', query, deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
    expect(query).not.toHaveBeenCalled();
  });

  it('surfaces a throwing query as a typed failure, never a throw across the boundary', async () => {
    const answer = await answerVersioned(bundled, undefined, () => {
      throw new Error('boom');
    });

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'boom' });
  });
});
