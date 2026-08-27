import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, resetDocsCache } from '../data/docs-resolver.js';
import { getApi } from './get-api.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getApi', () => {
  it('returns the resolved API surface by class name', () => {
    const api = getApi(docs, 'CngxSelect');

    expect(api).not.toBeNull();
    expect(api).toMatchObject({ name: 'CngxSelect', kind: 'component', selector: 'cngx-select', signal: true });
    expect(api?.inputs.map((i) => i.name)).toEqual(['value', 'disabled']);
    expect(api?.outputs.map((o) => o.name)).toEqual(['valueChange']);
    expect(api?.hostBindings).toEqual(['id']);
    expect(api?.methods).toEqual([{ name: 'open', returnType: 'void' }]);
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

describe('get_api version wiring', () => {
  beforeEach(() => resetDocsCache());

  it('grounds the answer against a fetched non-bundled version', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = answerVersioned(docs, '0.2.0', (resolved) => getApi(resolved, 'CngxSelect'), deps);

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    // v0.2.0 dropped the `disabled` input the bundled snapshot still lists.
    const result = (answer as { result: { inputs: { name: string }[] } }).result;
    expect(result.inputs.map((i) => i.name)).toEqual(['value']);
  });

  it('passes a fetch failure through as a typed result', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = answerVersioned(docs, '999.0.0', (resolved) => getApi(resolved, 'CngxSelect'), deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
