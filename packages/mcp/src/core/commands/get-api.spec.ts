import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadBundledDocs, loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, createDocsResolver } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { ApiResult } from './get-api.js';
import { getApi as getApiAnswer } from './get-api.js';
import { isAmbiguous } from '../query.js';

/** The query answer for a name that must not be ambiguous. */
function getApi(...args: Parameters<typeof getApiAnswer>): ApiResult | null {
  const answer = getApiAnswer(...args);
  if (isAmbiguous(answer)) {
    throw new Error(`unexpected ambiguity for ${args[1]}`);
  }
  return answer;
}

const FIXTURE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const V6 = fileURLToPath(new URL('../../../test/fixtures/documentation.v6.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);
const BUNDLED_DIR = fileURLToPath(new URL('../../../data/', import.meta.url));

describe('getApi', () => {
  it('returns the resolved API surface by class name', () => {
    const api = getApi(docs, 'CngxSelect');

    expect(api).not.toBeNull();
    expect(api).toMatchObject({ name: 'CngxSelect', kind: 'component', selector: 'cngx-select', signal: true });
    expect(api?.inputs.map((i) => i.name)).toEqual(['value', 'disabled', 'id']);
    expect(api?.outputs.map((o) => o.name)).toEqual(['valueChange']);
    expect(api?.hostBindings).toEqual(['id']);
    expect(api?.methods).toEqual([{ name: 'open', returnType: 'void' }]);
  });

  it('names an aliased schema-2 input by its binding and keeps the field', () => {
    const id = getApi(docs, 'CngxSelect')?.inputs.find((i) => i.name === 'id');

    expect(id).toMatchObject({ name: 'id', field: 'idInput', kind: 'input', defaultValue: 'null' });
    expect(getApi(docs, 'CngxSelect')?.inputs.find((i) => i.name === 'disabled')).not.toHaveProperty('field');
  });

  it('resolves by selector as well as class name', () => {
    expect(getApi(docs, 'cngx-select')?.name).toBe('CngxSelect');
  });

  it('resolves an injectable service, reading its methods from the `methods` key', () => {
    const api = getApi(docs, 'CngxToaster');

    expect(api).toMatchObject({ name: 'CngxToaster', kind: 'injectable', selector: null, signal: false });
    expect(api?.inputs).toEqual([]);
    expect(api?.outputs).toEqual([]);
    expect(api?.methods).toEqual([{ name: 'show', returnType: 'CngxToastRef' }]);
  });

  it('returns null for an unknown name', () => {
    expect(getApi(docs, 'CngxDoesNotExist')).toBeNull();
  });
});

describe('getApi over a schema-6 snapshot', () => {
  it('returns inputs, outputs and methods', () => {
    const api = getApi(loadDocsFromFile(V6), 'CngxSelect');

    expect(api).toMatchObject({ name: 'CngxSelect', kind: 'component', selector: 'cngx-select' });
    expect(api?.inputs.map((i) => i.name)).toContain('value');
    expect(api?.outputs.map((o) => o.name)).toContain('selectionChange');
    expect(api?.methods.map((m) => m.name)).toContain('open');
  });

  it('names aliased inputs by their binding, never by the class field', () => {
    const inputs = getApi(loadDocsFromFile(V6), 'CngxSelect')?.inputs ?? [];

    expect(inputs.find((i) => i.name === 'disabled')).toMatchObject({ field: 'disabledInput', kind: 'input', required: false });
    expect(inputs.find((i) => i.name === 'value')).toMatchObject({ kind: 'model' });
    expect(inputs.map((i) => i.name)).not.toContain('disabledInput');
    expect(inputs.map((i) => i.name)).toEqual(expect.arrayContaining(['id', 'required']));
  });

  it('derives signal-based from the members, not the entry flag compodocx sets to false', () => {
    const v6 = loadDocsFromFile(V6);
    const select = v6.components.find((c) => c.name === 'CngxSelect');

    expect(select?.signal).toBe(false);
    expect(getApi(v6, 'CngxSelect')?.signal).toBe(true);
  });
});

describe('get_api version wiring', () => {

  it('grounds the answer against a fetched non-bundled version', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '0.2.0', (resolved) => getApi(resolved, 'CngxSelect'));

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    // v0.2.0 dropped the `disabled` input the bundled snapshot still lists.
    const result = (answer as { result: { inputs: { name: string }[] } }).result;
    expect(result.inputs.map((i) => i.name)).toEqual(['value']);
  });

  it('passes a fetch failure through as a typed result', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '999.0.0', (resolved) => getApi(resolved, 'CngxSelect'));

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});

describe('getApi lists public methods only', () => {
  const withMethods = (modifierKinds: (number[] | undefined)[]): DocsIndex => ({
    ...docs,
    components: [
      { name: 'CngxM', methodsClass: modifierKinds.map((modifierKind, i) => ({ name: `m${i}`, returnType: 'void', modifierKind })) },
    ],
  });

  it('drops private and protected methods and keeps public, static and unmarked ones', () => {
    // 123 PrivateKeyword, 124 ProtectedKeyword, 125 PublicKeyword, 126 StaticKeyword (ts-morph's TypeScript 6.0).
    const api = getApi(withMethods([[123], [124], [125], [126], undefined, [126, 124]]), 'CngxM');

    expect(api?.methods.map((method) => method.name)).toEqual(['m2', 'm3', 'm4']);
  });

  // The TypeScript compodocx emits through, resolved from compodocx's own location.
  it('pins the private and protected keyword kinds to the ts-morph compodocx runs', () => {
    const local = createRequire(import.meta.url);
    const fromCompodocx = createRequire(local.resolve('@cngxjs/compodocx'));
    const { ts } = fromCompodocx('@ts-morph/common') as { ts: { SyntaxKind: Record<string, number> } };

    expect(ts.SyntaxKind['PrivateKeyword']).toBe(123);
    expect(ts.SyntaxKind['ProtectedKeyword']).toBe(124);
  });

  it('lists the full method list of CngxAsync, whose one method is static, from the bundled snapshot', () => {
    const api = getApi(loadBundledDocs(BUNDLED_DIR), 'CngxAsync');

    expect(api?.methods).toEqual([{ name: 'ngTemplateContextGuard', returnType: 'CngxAsyncContext<T>' }]);
  });

  // Pins the kind numbers against the snapshot compodocx actually wrote: a TypeScript
  // bump that renumbers SyntaxKind fails here instead of leaking template handlers.
  it('lists no protected template handler of CngxAvatar in the bundled snapshot', () => {
    const api = getApi(loadBundledDocs(BUNDLED_DIR), 'CngxAvatar');

    expect(api).not.toBeNull();
    expect(api?.methods.map((method) => method.name)).not.toContain('handleError');
    expect(api?.methods.map((method) => method.name)).not.toContain('handleLoad');
  });
});
