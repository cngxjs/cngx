import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDocsIndex, loadBundledDocs, loadDocsFromFile } from '../data/loader.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocEntry, DocToken, DocumentationJson } from '../data/types.js';
import { diffSnapshots } from './snapshot-diff.js';
import { classifyGhFailure, fetchSnapshot } from './snapshot-fetch.js';

const OLD = fileURLToPath(new URL('../../../test/fixtures/documentation.v-old.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const BUNDLED_DIR = fileURLToPath(new URL('../../../data/', import.meta.url));

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
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel', inferred: true }]);
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
    const from = index('1.0.0', [], [{ name: 'CNGX_OLD', type: 'token', tokenType: 'Cfg' }]);
    const to = index('2.0.0', [], [{ name: 'CNGX_NEW', type: 'token', tokenType: 'Cfg' }]);
    const delta = diffSnapshots(from, to);

    expect(delta.diTokens.removed).toEqual([{ name: 'CNGX_OLD' }]);
    expect(delta.diTokens.renamed).toEqual([]);
  });

  it('reports a changed token type as a signature change', () => {
    const from = index('1.0.0', [], [{ name: 'CNGX_X', type: 'token', tokenType: 'CfgA' }]);
    const to = index('2.0.0', [], [{ name: 'CNGX_X', type: 'token', tokenType: 'CfgB' }]);

    expect(diffSnapshots(from, to).diTokens.signatureChanged).toEqual([{ name: 'CNGX_X', fromSignature: 'CfgA', toSignature: 'CfgB' }]);
  });

  it('reports a token type edited in a copy of the bundled snapshot', () => {
    const bundled = loadBundledDocs(BUNDLED_DIR);
    const [first, ...rest] = bundled.tokens;
    const edited: DocsIndex = { ...bundled, tokens: [{ ...first, tokenType: `${first.tokenType}Changed` }, ...rest] };

    expect(first.type).toBe('token');
    expect(diffSnapshots(bundled, edited).diTokens.signatureChanged).toEqual([
      { name: first.name, fromSignature: first.tokenType, toSignature: `${first.tokenType}Changed` },
    ]);
  });

  it('still infers a top-level rename from the entry-shape fingerprint and marks it inferred', () => {
    const open = [{ name: 'open', type: 'boolean' }];
    const from = index('1.0.0', [{ name: 'CngxOld', file: 'projects/ui/overlay/old.ts', inputsClass: open }]);
    const to = index('2.0.0', [{ name: 'CngxNew', file: 'projects/ui/overlay/new.ts', inputsClass: open }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([{ from: 'CngxOld', to: 'CngxNew', inferred: true }]);
  });

  it('marks a coincidental same-shape pair as inferred, never as a certain rename', () => {
    const press = [{ name: 'disabled', type: 'boolean' }];
    const from = index('1.0.0', [{ name: 'CngxCloseButton', file: 'projects/common/button/close.ts', inputsClass: press }]);
    const to = index('2.0.0', [{ name: 'CngxBrandNewButton', file: 'projects/common/button/brand.ts', inputsClass: press }]);

    expect(diffSnapshots(from, to).components.renamed).toEqual([{ from: 'CngxCloseButton', to: 'CngxBrandNewButton', inferred: true }]);
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

    expect(delta.components.renamed).toEqual([{ from: 'CngxOld', to: 'CngxNew', inferred: true }]);
  });
});

describe('diffSnapshots across a kind change', () => {
  const index = (cngxVersion: string, components: DocEntry[], directives: DocEntry[]): DocsIndex => ({
    meta: { schemaVersion: 6, cngxVersion, generatedAt: null, compodocxVersion: null },
    components,
    directives,
    injectables: [],
    tokens: [],
    functions: [],
  });

  it('reports a component that became a directive as a kind change and diffs its members', () => {
    const inputs = [{ name: 'open', type: 'boolean' }, { name: 'legacy', type: 'string' }];
    const from = index('1.0.0', [{ name: 'CngxX', selector: 'cngx-x', inputsClass: inputs }], []);
    const to = index('2.0.0', [], [{ name: 'CngxX', selector: 'cngx-x', inputsClass: [inputs[0]] }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components).toEqual({
      removed: [],
      renamed: [],
      signatureChanged: [{ name: 'CngxX', fromSignature: 'component', toSignature: 'directive' }],
    });
    expect(delta.inputs.removed).toEqual([{ name: 'legacy', owner: 'CngxX' }]);
  });

  it('reports a moved selector next to the kind change', () => {
    const from = index('1.0.0', [], [{ name: 'CngxX', selector: '[cngxX]' }]);
    const to = index('2.0.0', [{ name: 'CngxX', selector: 'cngx-x' }], []);

    expect(diffSnapshots(from, to).components.signatureChanged).toEqual([
      { name: 'CngxX', fromSignature: 'directive', toSignature: 'component' },
      { name: 'CngxX', fromSignature: '[cngxX]', toSignature: 'cngx-x' },
    ]);
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

  it('reports a changed alias on an unchanged field as a rename of the public name', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'selected', type: 'boolean' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'checked', type: 'boolean' }] }]);
    const delta = diffSnapshots(from, to);

    expect(delta.inputs).toEqual({ removed: [], renamed: [{ from: 'selected', to: 'checked', owner: 'CngxX' }], signatureChanged: [] });
  });

  it('reports an added alias as a rename from the field name', () => {
    const from = index('1.0.0', [{ name: 'CngxX', outputsClass: [{ name: 'changed', type: 'string' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', outputsClass: [{ name: 'changed', alias: 'cngxChanged', type: 'string' }] }]);

    expect(diffSnapshots(from, to).outputs.renamed).toEqual([{ from: 'changed', to: 'cngxChanged', owner: 'CngxX' }]);
  });

  it('reports a removed alias as a rename to the field name, with a type change under the new name', () => {
    const from = index('1.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', alias: 'cngxValue', type: 'string' }] }]);
    const to = index('2.0.0', [{ name: 'CngxX', inputsClass: [{ name: 'value', type: 'number' }] }]);
    const delta = diffSnapshots(from, to);

    expect(delta.inputs.renamed).toEqual([{ from: 'cngxValue', to: 'value', owner: 'CngxX' }]);
    expect(delta.inputs.signatureChanged).toEqual([{ name: 'value', owner: 'CngxX', fromSignature: 'string', toSignature: 'number' }]);
    expect(delta.inputs.removed).toEqual([]);
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
    expect(diffSnapshots(from, renamedAlias).outputs).toEqual({ removed: [], renamed: [{ from: 'selected', to: 'checked', owner: 'CngxX' }], signatureChanged: [] });
  });
});

describe('diffSnapshots infers a slot rename only from a unique, non-empty key', () => {
  const index = (cngxVersion: string, slots: { name: string; description: string }[]): DocsIndex => ({
    meta: { schemaVersion: 6, cngxVersion, generatedAt: null, compodocxVersion: null },
    components: [{ name: 'CngxX', slots }],
    directives: [],
    injectables: [],
    tokens: [],
    functions: [],
  });

  const a = { name: 'cngxA', description: 'The caret.' };
  const b = { name: 'cngxB', description: 'The caret.' };
  const added = { name: 'cngxC', description: 'The caret.' };

  it.each([
    ['a, b', [a, b]],
    ['b, a', [b, a]],
  ])('reports two removed slots sharing a description against one added slot as two removals (%s)', (_, fromSlots) => {
    const delta = diffSnapshots(index('1.0.0', fromSlots), index('2.0.0', [added]));

    expect(delta.slots.renamed).toEqual([]);
    expect(delta.slots.removed).toEqual(fromSlots.map((slot) => ({ name: slot.name, owner: 'CngxX' })));
  });

  it.each([[''], ['   ']])('never pairs slots whose description is %j', (description) => {
    const delta = diffSnapshots(index('1.0.0', [{ name: 'cngxA', description }]), index('2.0.0', [{ name: 'cngxB', description }]));

    expect(delta.slots.renamed).toEqual([]);
    expect(delta.slots.removed).toEqual([{ name: 'cngxA', owner: 'CngxX' }]);
  });

  it('still pairs one removed and one added slot with the same description', () => {
    const delta = diffSnapshots(index('1.0.0', [a]), index('2.0.0', [added]));

    expect(delta.slots.renamed).toEqual([{ from: 'cngxA', to: 'cngxC', owner: 'CngxX' }]);
  });
});

describe('diffSnapshots normalises slot names that carry their description', () => {
  const index = (cngxVersion: string, slot: { name: string; description: string }): DocsIndex => ({
    meta: { schemaVersion: 6, cngxVersion, generatedAt: null, compodocxVersion: null },
    components: [{ name: 'CngxX', slots: [slot] }],
    directives: [],
    injectables: [],
    tokens: [],
    functions: [],
  });

  it('reports a description edit as a signature change, not a removed slot', () => {
    const from = index('1.0.0', { name: 'cngxX Old text.\n<example-url>http://localhost:4200/#/a</example-url>', description: '' });
    const to = index('2.0.0', { name: 'cngxX New text.', description: '' });
    const delta = diffSnapshots(from, to);

    expect(delta.slots.removed).toEqual([]);
    expect(delta.slots.signatureChanged).toEqual([{ name: 'cngxX', owner: 'CngxX', fromSignature: 'Old text.', toSignature: 'New text.' }]);
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
      { from: 'CngxOldSelect', to: 'CngxNewSelect', inferred: true },
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
