import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocsResolver, DocsResolverDeps } from '../data/docs-resolver.js';
import { createDocsResolver } from '../data/docs-resolver.js';
import { migrateUsage, migrateUsageCommand, migrateUsageMarkdown } from './migrate-usage.js';
import type { CategoryDelta, SignatureChangedEntry, UsageDelta } from '../diff/types.js';

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
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel', inferred: true }]);
  });

  it('accepts a leading v on `from`, as its describe says', async () => {
    const fetchSnapshot = vi.fn<DocsResolverDeps['fetchSnapshot']>(async () => ({ ok: true, path: OLD }));
    const deps: DocsResolverDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

    const result = await migrateUsage(bundledNew, { from: 'v0.1.0', to: '0.2.0' }, createDocsResolver(bundledNew, deps));

    expect(result.ok).toBe(true);
    expect((result as UsageDelta).meta.resolvedFrom).toBe('0.1.0');
    expect(fetchSnapshot).toHaveBeenCalledWith('0.1.0');
    expect(migrateUsageCommand.input.from.description).toContain('a leading "v" is accepted');
  });

  it.each([
    ['0.1.0', ' bad', 'to " bad" is not a release version'],
    ['01.2.3', undefined, 'from "01.2.3" is not a release version'],
    ['0.1.0', '1.2.3-rc.', 'to "1.2.3-rc." is not a release version'],
  ])('rejects from %j to %j as invalid-version without calling the resolver', async (from, to, message) => {
    const resolve = vi.fn<DocsResolver>();

    const result = await migrateUsage(bundledNew, { from, to }, resolve);

    expect(result).toEqual({
      ok: false,
      meta: { from, to: to ?? '0.2.0' },
      reason: 'invalid-version',
      message: expect.stringMatching(new RegExp(`^${message.replace(/[.]/g, '\\.')}`)),
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  describe('over an unstamped bundled snapshot', () => {
    const unstamped: DocsIndex = { ...bundledNew, meta: { ...bundledNew.meta, cngxVersion: null } };

    it('answers asset-missing without a to version and never calls the resolver', async () => {
      const resolve = vi.fn<DocsResolver>();

      const result = await migrateUsage(unstamped, { from: '0.1.0' }, resolve);

      expect(result).toEqual({
        ok: false,
        meta: { from: '0.1.0', to: 'unknown' },
        reason: 'asset-missing',
        message: 'The bundled snapshot carries no cngxVersion; pass a to version.',
      });
      expect(resolve).not.toHaveBeenCalled();
    });

    it('still validates a malformed from before naming the missing stamp', async () => {
      const resolve = vi.fn<DocsResolver>();

      const result = await migrateUsage(unstamped, { from: '1.2' }, resolve);

      expect(result).toMatchObject({ ok: false, reason: 'invalid-version', message: expect.stringMatching(/^from "1\.2" is not/) });
      expect(resolve).not.toHaveBeenCalled();
    });

    it('resolves an explicit valid to version', async () => {
      const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: OLD }), loadDocs: loadDocsFromFile };

      const result = await migrateUsage(unstamped, { from: '0.1.0', to: '0.2.0' }, createDocsResolver(unstamped, deps));

      expect(result.ok).toBe(true);
      expect((result as UsageDelta).meta).toMatchObject({ from: '0.1.0', to: '0.2.0' });
    });
  });

  it('renders an inferred rename and its selector change as two component rows', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: OLD }), loadDocs: loadDocsFromFile };

    const result = await migrateUsage(bundledNew, { from: '0.1.0', to: '0.2.0' }, createDocsResolver(bundledNew, deps));
    const markdown = migrateUsageMarkdown(result as UsageDelta);

    expect(markdown).toContain('|renamed (inferred)|`CngxOldPanel`|`CngxNewPanel`|');
    expect(markdown).toContain('|selector|`CngxNewPanel`|`cngx-old-panel` -> `cngx-new-panel`|');
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
      functions: [],
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

  it('marks a throw inside the migration as internal, inside the typed reason set', async () => {
    const resolve = async () => {
      throw new Error('boom');
    };

    const result = await migrateUsageCommand.run({ bundled: bundledNew, resolve }, { from: '0.1.0', to: undefined });

    expect(result).toMatchObject({ ok: false, reason: 'asset-missing', message: 'internal: boom' });
  });
});

describe('migrateUsageMarkdown labels', () => {
  const none: CategoryDelta = { removed: [], renamed: [], signatureChanged: [] };
  const delta = (category: 'inputs' | 'slots' | 'components', change: SignatureChangedEntry): UsageDelta => ({
    ok: true,
    meta: { from: '1.0.0', to: '2.0.0', resolvedFrom: '1.0.0', resolvedTo: '2.0.0' },
    components: none,
    inputs: none,
    outputs: none,
    slots: none,
    diTokens: none,
    [category]: { ...none, signatureChanged: [change] },
  });
  const input = (fromSignature: string, toSignature: string, changed: SignatureChangedEntry['changed']) =>
    migrateUsageMarkdown(delta('inputs', { name: 'value', owner: 'CngxX', fromSignature, toSignature, changed }));

  it('labels a required to optional input as required', () => {
    expect(input('string (required)', 'string', ['required'])).toContain('|required|`CngxX.value`|');
  });

  it('labels a model to input-signal input as binding kind', () => {
    expect(input('string (model)', 'string (input-signal)', ['binding kind'])).toContain('|binding kind|`CngxX.value`|');
  });

  it('lists every changed part in order', () => {
    expect(input('string', 'number (required)', ['type', 'required'])).toContain('|type, required|`CngxX.value`|');
  });

  it('labels a function-typed input by its flag, not by its type', () => {
    expect(input('() => void', '() => void (required)', ['required'])).toContain('|required|`CngxX.value`|');
  });

  it('labels a slot description that reads like a kind flip as description', () => {
    const markdown = migrateUsageMarkdown(delta('slots', { name: 'cngxA', owner: 'CngxX', fromSignature: 'component', toSignature: 'directive' }));

    expect(markdown).toContain('|description|`CngxX.cngxA`|');
    expect(markdown).not.toContain('|kind|');
  });

  it('still labels a component to directive flip as kind', () => {
    expect(migrateUsageMarkdown(delta('components', { name: 'CngxX', fromSignature: 'component', toSignature: 'directive' }))).toContain(
      '|kind|`CngxX`|',
    );
  });
});
