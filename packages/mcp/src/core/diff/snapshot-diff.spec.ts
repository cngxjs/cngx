import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDocsIndex, loadDocsFromFile } from '../data/loader.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocEntry, DocToken, DocumentationJson } from '../data/types.js';
import { diffSnapshots } from './snapshot-diff.js';
import { classifyGhFailure, fetchSnapshot } from './snapshot-fetch.js';

const OLD = fileURLToPath(new URL('../../../test/fixtures/documentation.v-old.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

describe('diffSnapshots', () => {
  const delta = diffSnapshots(loadDocsFromFile(OLD), loadDocsFromFile(NEW));

  it('records the resolved snapshot versions in meta', () => {
    expect(delta.meta).toMatchObject({ resolvedFrom: '0.1.0', resolvedTo: '0.2.0', from: '0.1.0', to: '0.2.0' });
  });

  it('reports a removed input under its owning component', () => {
    expect(delta.inputs.removed).toEqual([{ name: 'legacyMode', owner: 'CngxSelect' }]);
    expect(delta.inputs.renamed).toEqual([]);
    expect(delta.inputs.signatureChanged).toEqual([]);
  });

  it('infers a component rename from a stable lib and shape', () => {
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel' }]);
    expect(delta.components.signatureChanged).toEqual([]);
  });

  it('reports a removed injectable service as removed, never rename-inferred', () => {
    // CngxLegacyAnnouncer exists only in v0.1.0; injectables carry no rename key,
    // so the removal is reported plainly instead of being paired with an addition.
    expect(delta.components.removed).toEqual([{ name: 'CngxLegacyAnnouncer' }]);
  });

  it('reports a changed slot as a signature change, not a removal', () => {
    expect(delta.slots.signatureChanged).toEqual([
      {
        name: 'cngxSelectCaret',
        owner: 'CngxSelect',
        fromSignature: 'The caret glyph.',
        toSignature: 'The caret glyph; now also fires on hover.',
      },
    ]);
    expect(delta.slots.removed).toEqual([]);
  });

  it('reports no delta for the unchanged DI token', () => {
    expect(delta.diTokens).toEqual({ removed: [], renamed: [], signatureChanged: [] });
  });
});

describe('diffSnapshots rename inference is fingerprint-gated', () => {
  const index = (cngxVersion: string, components: DocEntry[], tokens: DocToken[] = []): DocsIndex => ({
    meta: { schemaVersion: 2, cngxVersion, generatedAt: null, compodocxVersion: null },
    components,
    directives: [],
    injectables: [],
    tokens,
    functions: [],
  });

  it('reports a removed input as removed even when a same-typed input is added', () => {
    const from = index('1.0.0', [
      { name: 'CngxX', inputsClass: [{ name: 'disabled', type: 'boolean' }, { name: 'value', type: 'string' }] },
    ]);
    const to = index('2.0.0', [
      { name: 'CngxX', inputsClass: [{ name: 'checked', type: 'boolean' }, { name: 'value', type: 'string' }] },
    ]);
    const delta = diffSnapshots(from, to);

    expect(delta.inputs.removed).toEqual([{ name: 'disabled', owner: 'CngxX' }]);
    expect(delta.inputs.renamed).toEqual([]);
  });

  it('reports a removed DI token as removed, never a bare-type rename', () => {
    const from = index('1.0.0', [], [{ name: 'CNGX_OLD', type: 'InjectionToken<Cfg>' }]);
    const to = index('2.0.0', [], [{ name: 'CNGX_NEW', type: 'InjectionToken<Cfg>' }]);
    const delta = diffSnapshots(from, to);

    expect(delta.diTokens.removed).toEqual([{ name: 'CNGX_OLD' }]);
    expect(delta.diTokens.renamed).toEqual([]);
  });

  it('still infers a top-level rename from the entry-shape fingerprint', () => {
    const open = [{ name: 'open', type: 'boolean' }];
    const from = index('1.0.0', [{ name: 'CngxOld', file: 'projects/ui/overlay/old.ts', inputsClass: open }]);
    const to = index('2.0.0', [{ name: 'CngxNew', file: 'projects/ui/overlay/new.ts', inputsClass: open }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([{ from: 'CngxOld', to: 'CngxNew' }]);
  });

  it('reports a removal when two added entries share the lib and shape, never a guess', () => {
    const open = [{ name: 'open', type: 'boolean' }];
    const from = index('1.0.0', [{ name: 'CngxOld', file: 'projects/ui/overlay/old.ts', inputsClass: open }]);
    const to = index('2.0.0', [
      { name: 'CngxNewA', file: 'projects/ui/overlay/a.ts', inputsClass: open },
      { name: 'CngxNewB', file: 'projects/ui/sidenav/b.ts', inputsClass: open },
    ]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([]);
    expect(delta.components.removed).toEqual([{ name: 'CngxOld' }]);
  });

  it('reports two host-only directives without inputs or outputs as removed and added, never a rename', () => {
    const from = index('1.0.0', [{ name: 'CngxAutofocus', file: 'projects/common/a11y/autofocus.ts' }]);
    const to = index('2.0.0', [{ name: 'CngxFocusRing', file: 'projects/common/a11y/focus-ring.ts' }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([]);
    expect(delta.components.removed).toEqual([{ name: 'CngxAutofocus' }]);
  });

  it('pairs two file-less entries through the empty-lib key', () => {
    const open = [{ name: 'open', type: 'boolean' }];
    const from = index('1.0.0', [{ name: 'CngxOld', inputsClass: open }]);
    const to = index('2.0.0', [{ name: 'CngxNew', inputsClass: open }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([{ from: 'CngxOld', to: 'CngxNew' }]);
  });
});

describe('diffSnapshots keys inputs and outputs on their public name', () => {
  const index = (cngxVersion: string, components: DocEntry[]): DocsIndex => ({
    meta: { schemaVersion: 6, cngxVersion, generatedAt: null, compodocxVersion: null },
    components,
    directives: [],
    injectables: [],
    tokens: [],
    functions: [],
  });

  it('reports an alias rename on an unchanged field as a removal of the old alias', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'selected', type: 'boolean' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'checked', type: 'boolean' }] }]);
    const delta = diffSnapshots(from, to);

    expect(delta.inputs.removed).toEqual([{ name: 'selected', owner: 'CngxX' }]);
    expect(delta.inputs.signatureChanged).toEqual([]);
  });

  it('reports no change for a field rename under an unchanged alias', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'selected', type: 'boolean' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'checked', alias: 'selected', type: 'boolean' }] }]);

    expect(diffSnapshots(from, to).inputs).toEqual({ removed: [], renamed: [], signatureChanged: [] });
  });

  it('reports required false to true as a signature change', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', type: 'string', required: false, signalKind: 'input' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', type: 'string', required: true, signalKind: 'input' }] }]);

    expect(diffSnapshots(from, to).inputs.signatureChanged).toEqual([
      { name: 'value', owner: 'CngxX', fromSignature: 'string (input)', toSignature: 'string (required, input)' },
    ]);
  });

  it('reports a signal kind change as a signature change', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', type: 'string', signalKind: 'input' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', type: 'string', signalKind: 'model' }] }]);

    expect(diffSnapshots(from, to).inputs.signatureChanged).toHaveLength(1);
  });

  it('matches outputs on their alias', () => {
    const from = index('1.0.0', [{ name: 'CngxX', outputsClass: [{ name: 'value', alias: 'selected', type: 'boolean' }] }]);
    const renamedField = index('2.0.0', [{ name: 'CngxX', outputsClass: [{ name: 'checked', alias: 'selected', type: 'boolean' }] }]);
    const renamedAlias = index('2.0.0', [{ name: 'CngxX', outputsClass: [{ name: 'value', alias: 'checked', type: 'boolean' }] }]);

    expect(diffSnapshots(from, renamedField).outputs.removed).toEqual([]);
    expect(diffSnapshots(from, renamedAlias).outputs.removed).toEqual([{ name: 'selected', owner: 'CngxX' }]);
  });
});

describe('diffSnapshots across schema 2 and schema 6', () => {
  const shape: Pick<DocEntry, 'inputsClass' | 'outputsClass'> = {
    inputsClass: [{ name: 'value' }],
    outputsClass: [{ name: 'valueChange' }],
  };

  it('pairs a rename whose derived category differs from the schema-2 tag', () => {
    const from: DocumentationJson = {
      schemaVersion: 2,
      cngxVersion: '0.1.0-rc.8',
      components: [
        { name: 'CngxOldSelect', category: 'forms/select/single-select', file: 'projects/forms/select/single-select/old.ts', ...shape },
      ],
    };
    const to: DocumentationJson = {
      schemaVersion: 6,
      cngxVersion: '0.1.0-rc.9',
      components: [
        {
          name: 'CngxNewSelect',
          file: 'projects/forms/select/single-select/new.ts',
          feature: { entryPoint: '@cngx/forms/select', key: '' },
          ...shape,
        },
      ],
    };
    const toIndex = createDocsIndex(to);

    expect(toIndex.components[0].category).toBe('forms/select');
    expect(diffSnapshots(createDocsIndex(from), toIndex).components.renamed).toEqual([
      { from: 'CngxOldSelect', to: 'CngxNewSelect' },
    ]);
  });
});

describe('fetchSnapshot failure classification', () => {
  const stub = {
    makeTempDir: () => '/tmp/cngx-mcp-snapshot-test',
    removeDir: () => undefined,
    releaseBaseUrl: 'https://example.test/releases/download',
    writeFile: () => undefined,
  };
  const notFound = async () => ({ status: 404, body: '' });

  it('falls through to HTTPS when the gh CLI is absent, so gh-missing never surfaces', async () => {
    const result = await fetchSnapshot('9.9.9', {
      ...stub,
      httpGet: notFound,
      runGh: async () => {
        const error = new Error('spawn gh ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      },
    });
    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it('classifies a missing release asset', async () => {
    const result = await fetchSnapshot('9.9.9', {
      ...stub,
      httpGet: notFound,
      runGh: async () => {
        throw new Error('release not found');
      },
    });
    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it('classifies a network failure', async () => {
    const result = await fetchSnapshot('9.9.9', {
      ...stub,
      httpGet: async () => {
        throw new TypeError('fetch failed');
      },
      runGh: async () => {
        throw new Error('dial tcp: lookup api.github.com: no such host');
      },
    });
    expect(result).toMatchObject({ ok: false, reason: 'network' });
  });

  it('returns the downloaded path on success', async () => {
    const result = await fetchSnapshot('0.2.0', {
      ...stub,
      makeTempDir: () => '/tmp/cngx-mcp-ok',
      httpGet: notFound,
      runGh: async () => undefined,
    });
    expect(result).toEqual({ ok: true, path: '/tmp/cngx-mcp-ok/documentation.json', dir: '/tmp/cngx-mcp-ok' });
  });

  it('treats an unknown gh failure as asset-missing', () => {
    expect(classifyGhFailure(new Error('something odd happened')).reason).toBe('asset-missing');
  });
});
