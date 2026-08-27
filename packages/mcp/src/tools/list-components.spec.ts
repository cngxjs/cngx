import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { entryLib } from '../query.js';
import { listComponents } from './list-components.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('listComponents', () => {
  it('enumerates the full catalog as sorted summaries', () => {
    const result = listComponents(docs);

    expect(result.map((s) => s.name)).toEqual(['CngxAccordionItem', 'CngxRipple', 'CngxSelect', 'CngxToaster']);
    expect(result).toContainEqual({
      name: 'CngxSelect',
      kind: 'component',
      selector: 'cngx-select',
      category: 'forms/select/single-select',
      lib: 'forms',
    });
    expect(result).toContainEqual({
      name: 'CngxRipple',
      kind: 'directive',
      selector: '[cngxRipple]',
      category: 'common/interactive',
      lib: 'common',
    });
  });

  it('filters by lib', () => {
    const result = listComponents(docs, { lib: 'forms' });

    expect(result.map((s) => s.name)).toEqual(['CngxSelect']);
  });

  it('filters by kind', () => {
    const result = listComponents(docs, { kind: 'directive' });

    expect(result.map((s) => s.name)).toEqual(['CngxRipple']);
  });

  it('surfaces injectable services with a null selector and a derived lib', () => {
    const result = listComponents(docs, { kind: 'injectable' });

    expect(result).toEqual([
      {
        name: 'CngxToaster',
        kind: 'injectable',
        selector: null,
        category: 'ui/feedback/toast',
        lib: 'ui',
      },
    ]);
  });

  it('composes the lib and kind filters', () => {
    expect(listComponents(docs, { lib: 'common', kind: 'directive' }).map((s) => s.name)).toEqual(['CngxRipple']);
    expect(listComponents(docs, { lib: 'common', kind: 'component' })).toEqual([]);
  });

  it('returns an empty list for an unknown lib, never null', () => {
    expect(listComponents(docs, { lib: 'nope' })).toEqual([]);
  });
});

describe('entryLib', () => {
  it('derives the lib from a projects/<lib>/... file path', () => {
    expect(entryLib({ name: 'X', file: 'projects/common/interactive/ripple.directive.ts' })).toBe('common');
  });

  it('returns null when the file is absent or off-pattern', () => {
    expect(entryLib({ name: 'X' })).toBeNull();
    expect(entryLib({ name: 'X', file: 'packages/mcp/src/index.ts' })).toBeNull();
  });
});
