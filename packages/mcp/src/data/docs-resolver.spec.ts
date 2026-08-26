import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDocsFromFile, SchemaVersionError } from './loader.js';
import type { DocsResolverDeps } from './docs-resolver.js';
import { answerVersioned, resetDocsCache, resolveDocs } from './docs-resolver.js';
import type { SnapshotFetchFailureReason } from '../diff/types.js';

const SAMPLE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

const bundled = loadDocsFromFile(SAMPLE); // cngxVersion 0.1.0-rc.6

beforeEach(() => {
  resetDocsCache();
});

describe('resolveDocs', () => {
  it('short-circuits to the bundled snapshot with no fetch when version is absent', () => {
    const fetchSnapshot = vi.fn();
    const resolution = resolveDocs(bundled, undefined, { fetchSnapshot, loadDocs: loadDocsFromFile });

    expect(resolution).toEqual({ ok: true, docs: bundled, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('short-circuits with no fetch when version equals the bundled cngxVersion', () => {
    const fetchSnapshot = vi.fn();
    const resolution = resolveDocs(bundled, '0.1.0-rc.6', { fetchSnapshot, loadDocs: loadDocsFromFile });

    expect(resolution).toMatchObject({ ok: true, version: '0.1.0-rc.6' });
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it('fetches a non-bundled version once and serves the second call from cache', () => {
    const fetchSnapshot = vi.fn(() => ({ ok: true as const, path: NEW }));
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const first = resolveDocs(bundled, '0.2.0', deps);
    const second = resolveDocs(bundled, '0.2.0', deps);

    expect(first).toMatchObject({ ok: true, version: '0.2.0' });
    expect(second).toMatchObject({ ok: true, version: '0.2.0' });
    // The fetched DocsIndex is reused verbatim on the cache hit.
    expect((second as { docs: unknown }).docs).toBe((first as { docs: unknown }).docs);
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it('maps a SchemaVersionError from the fetched snapshot to asset-missing', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: true, path: '/tmp/wrong-schema.json' }),
      loadDocs: () => {
        throw new SchemaVersionError(3, 2);
      },
    };

    const resolution = resolveDocs(bundled, '0.2.0', deps);

    expect(resolution).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it.each<SnapshotFetchFailureReason>(['gh-missing', 'network', 'asset-missing'])(
    'passes the %s fetch failure through untouched',
    (reason) => {
      const deps: DocsResolverDeps = {
        fetchSnapshot: () => ({ ok: false, reason, message: `${reason} detail` }),
        loadDocs: loadDocsFromFile,
      };

      const resolution = resolveDocs(bundled, '9.9.9', deps);

      expect(resolution).toEqual({ ok: false, reason, message: `${reason} detail` });
    },
  );
});

describe('answerVersioned', () => {
  it('wraps a bundled answer with the bundled groundedVersion', () => {
    const answer = answerVersioned(bundled, undefined, (docs) => docs.components.length);

    expect(answer).toEqual({ groundedVersion: '0.1.0-rc.6', result: bundled.components.length });
  });

  it('grounds the query against a fetched non-bundled snapshot', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = answerVersioned(bundled, '0.2.0', (docs) => docs.meta.cngxVersion, deps);

    expect(answer).toEqual({ groundedVersion: '0.2.0', result: '0.2.0' });
  });

  it('returns the typed failure instead of running the query on a fetch failure', () => {
    const query = vi.fn();
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = answerVersioned(bundled, '9.9.9', query, deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
    expect(query).not.toHaveBeenCalled();
  });
});
