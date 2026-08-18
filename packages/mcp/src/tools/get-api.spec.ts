import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getApi } from './get-api.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
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

  it('returns null for an unknown name', () => {
    expect(getApi(docs, 'CngxDoesNotExist')).toBeNull();
  });
});
