import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { resetDocsCache } from '../data/docs-resolver.js';
import type { MigrateUsageDeps } from './migrate-usage.js';
import { migrateUsage } from './migrate-usage.js';
import type { UsageDelta } from '../diff/types.js';

const OLD = fileURLToPath(new URL('../../test/fixtures/documentation.v-old.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

const bundledNew = loadDocsFromFile(NEW); // cngxVersion 0.2.0

describe('migrateUsage', () => {
  // migrateUsage now resolves through the shared version cache; clear it so a snapshot
  // fetched in one test cannot satisfy a later test that injects different deps.
  beforeEach(() => resetDocsCache());

  it('defaults `to` to the bundled snapshot version', () => {
    const result = migrateUsage(bundledNew, { from: '0.2.0' });

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    expect(delta.meta).toMatchObject({ from: '0.2.0', to: '0.2.0', resolvedFrom: '0.2.0', resolvedTo: '0.2.0' });
    // Bundled-vs-bundled: nothing removed, renamed, or signature-changed.
    expect(delta.components).toEqual({ removed: [], renamed: [], signatureChanged: [] });
    expect(delta.inputs).toEqual({ removed: [], renamed: [], signatureChanged: [] });
  });

  it('fetches a non-bundled `from` and returns the delta (fetch stubbed to a fixture)', () => {
    const deps: MigrateUsageDeps = {
      fetchSnapshot: () => ({ ok: true, path: OLD }),
      loadDocs: loadDocsFromFile,
    };

    const result = migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, deps);

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    expect(delta.meta).toMatchObject({ from: '0.1.0', to: '0.2.0', resolvedFrom: '0.1.0', resolvedTo: '0.2.0' });
    expect(delta.inputs.removed).toEqual([{ name: 'legacyMode', owner: 'CngxSelect' }]);
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel' }]);
  });

  it('falls back the resolved label to the requested version when a fetched snapshot is unstamped', () => {
    // The M0 Release asset is the raw, un-stamped compodocx export (cngxVersion null).
    const rawUnstamped = {
      meta: { schemaVersion: 2, cngxVersion: null, generatedAt: null, compodocxVersion: null },
      components: [],
      directives: [],
      tokens: [],
    };
    const deps: MigrateUsageDeps = {
      fetchSnapshot: () => ({ ok: true, path: '/tmp/raw-unstamped.json' }),
      loadDocs: () => rawUnstamped,
    };

    const result = migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, deps);

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    // `from` fetched the unstamped raw asset -> resolvedFrom falls back to '0.1.0';
    // `to` matched the stamped bundle -> resolvedTo keeps its real '0.2.0'.
    expect(delta.meta).toEqual({ from: '0.1.0', to: '0.2.0', resolvedFrom: '0.1.0', resolvedTo: '0.2.0' });
  });

  it('surfaces a fetch failure as a typed result, never a throw', () => {
    const deps: MigrateUsageDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'release not found' }),
      loadDocs: loadDocsFromFile,
    };

    const result = migrateUsage(bundledNew, { from: '9.9.9', to: '0.2.0' }, deps);

    expect(result).toEqual({
      ok: false,
      meta: { from: '9.9.9', to: '0.2.0' },
      reason: 'asset-missing',
      message: 'release not found',
    });
  });

  it('surfaces an unreadable fetched snapshot inside the typed reason set', () => {
    const deps: MigrateUsageDeps = {
      fetchSnapshot: () => ({ ok: true, path: '/tmp/does-not-exist.json' }),
      loadDocs: () => {
        throw new Error('ENOENT');
      },
    };

    const result = migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, deps);

    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
  });
});
