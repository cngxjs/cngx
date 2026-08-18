import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getStoryExample } from './get-story-example.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getStoryExample', () => {
  it('returns example URLs, a null StackBlitz URL, and labelled source references', () => {
    const result = getStoryExample(docs, 'CngxSelect');

    expect(result).toMatchObject({ name: 'CngxSelect', kind: 'component', stackblitzUrl: null });
    expect(result?.exampleUrls).toEqual(['https://cngxjs.github.io/cngx/examples/#/forms/select/single-select/clearable']);
    expect(result?.sourceReferences).toEqual([
      { title: 'Material theme', fileRef: './examples/material-theme/material-theme.component.ts', line: 0 },
    ]);
  });

  it('returns only public example URLs - no localhost leaks through', () => {
    for (const url of getStoryExample(docs, 'CngxSelect')?.exampleUrls ?? []) {
      expect(url).not.toContain('localhost');
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('returns null for an unknown name', () => {
    expect(getStoryExample(docs, 'CngxDoesNotExist')).toBeNull();
  });
});
