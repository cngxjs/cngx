import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { createDocsResolver } from '../data/docs-resolver.js';
import { migrateUsage } from './migrate-usage.js';
import type { UsageDelta } from '../diff/types.js';

const OLD = fileURLToPath(new URL('../../../test/fixtures/documentation.v-old.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const V6 = fileURLToPath(new URL('../../../test/fixtures/documentation.v6.sample.json', import.meta.url));

const bundledNew = loadDocsFromFile(NEW); // cngxVersion 0.2.0

describe('migrateUsage', () => {

  it('defaults `to` to the bundled snapshot version', async () => {
    const result = await migrateUsage(bundledNew, { from: '0.2.0' }, createDocsResolver(bundledNew));

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    expect(delta.meta).toMatchObject({ from: '0.2.0', to: '0.2.0', resolvedFrom: '0.2.0', resolvedTo: '0.2.0' });
    // Bundled-vs-bundled: nothing removed, renamed, or signature-changed.
    expect(delta.components).toEqual({ removed: [], renamed: [], signatureChanged: [] });
    expect(delta.inputs).toEqual({ removed: [], renamed: [], signatureChanged: [] });
  });

  it('fetches a non-bundled `from` and returns the delta (fetch stubbed to a fixture)', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: OLD }),
      loadDocs: loadDocsFromFile,
    };

    const result = await migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, createDocsResolver(bundledNew, deps));

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    expect(delta.meta).toMatchObject({ from: '0.1.0', to: '0.2.0', resolvedFrom: '0.1.0', resolvedTo: '0.2.0' });
    expect(delta.inputs.removed).toEqual([{ name: 'legacyMode', owner: 'CngxSelect' }]);
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel' }]);
  });

  it('diffs a schema-2 `from` against a schema-6 bundled `to`', async () => {
    const bundledV6 = loadDocsFromFile(V6); // schemaVersion 6, cngxVersion 0.1.0-rc.9
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: OLD }),
      loadDocs: loadDocsFromFile,
    };

    const result = await migrateUsage(bundledV6, { from: '0.1.0' }, createDocsResolver(bundledV6, deps));

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    expect(delta.meta).toEqual({ from: '0.1.0', to: '0.1.0-rc.9', resolvedFrom: '0.1.0', resolvedTo: '0.1.0-rc.9' });
  });

  it('falls back the resolved label to the requested version when a fetched snapshot is unstamped', async () => {
    // The M0 Release asset is the raw, un-stamped compodocx export (cngxVersion null).
    const rawUnstamped = {
      meta: { schemaVersion: 2, cngxVersion: null, generatedAt: null, compodocxVersion: null },
      components: [],
      directives: [],
      injectables: [],
      tokens: [],
    };
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: '/tmp/raw-unstamped.json' }),
      loadDocs: () => rawUnstamped,
    };

    const result = await migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, createDocsResolver(bundledNew, deps));

    expect(result.ok).toBe(true);
    const delta = result as UsageDelta;
    // `from` fetched the unstamped raw asset -> resolvedFrom falls back to '0.1.0';
    // `to` matched the stamped bundle -> resolvedTo keeps its real '0.2.0'.
    expect(delta.meta).toEqual({ from: '0.1.0', to: '0.2.0', resolvedFrom: '0.1.0', resolvedTo: '0.2.0' });
  });

  it('surfaces a fetch failure as a typed result, never a throw', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'release not found' }),
      loadDocs: loadDocsFromFile,
    };

    const result = await migrateUsage(bundledNew, { from: '9.9.9', to: '0.2.0' }, createDocsResolver(bundledNew, deps));

    expect(result).toEqual({
      ok: false,
      meta: { from: '9.9.9', to: '0.2.0' },
      reason: 'asset-missing',
      message: 'release not found',
    });
  });

  it('surfaces an unreadable fetched snapshot inside the typed reason set', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: true, path: '/tmp/does-not-exist.json' }),
      loadDocs: () => {
        throw new Error('ENOENT');
      },
    };

    const result = await migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, createDocsResolver(bundledNew, deps));

    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
  });
});
