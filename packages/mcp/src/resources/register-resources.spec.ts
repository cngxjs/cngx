import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile, type DocsIndex } from '../data/loader.js';
import type { ComponentSummary } from '../tools/list-components.js';
import {
  completeApiName,
  readApi,
  readCatalog,
  readLlms,
  readProvenance,
  readTokens,
} from './register-resources.js';

const FIXTURE = fileURLToPath(
  new URL('../../test/fixtures/documentation.sample.json', import.meta.url),
);
const docs = loadDocsFromFile(FIXTURE);

function bodyOf<T>(result: { contents: { text?: string }[] }): T {
  return JSON.parse(result.contents[0].text ?? 'null') as T;
}

describe('readCatalog (cngx://catalog)', () => {
  it('serves the full catalog as application/json, reusing the list_components projection', () => {
    const result = readCatalog(docs);

    expect(result.contents[0].uri).toBe('cngx://catalog');
    expect(result.contents[0].mimeType).toBe('application/json');
    const summaries = bodyOf<ComponentSummary[]>(result);
    expect(summaries).toContainEqual({
      name: 'CngxSelect',
      kind: 'component',
      selector: 'cngx-select',
      category: 'forms/select/single-select',
      lib: 'forms',
    });
  });

  it('derives lib through entryLib, surfacing lib: null (never category) for an off-pattern file', () => {
    const withOrphan: DocsIndex = {
      ...docs,
      components: [
        ...docs.components,
        { name: 'CngxOrphan', selector: 'cngx-orphan', category: 'ui/accordion' },
      ],
    };

    const summaries = bodyOf<ComponentSummary[]>(readCatalog(withOrphan));
    const orphan = summaries.find((s) => s.name === 'CngxOrphan');
    expect(orphan?.lib).toBeNull();
  });
});

describe('readTokens (cngx://tokens)', () => {
  it('serves the DI token list', () => {
    const result = readTokens(docs);

    expect(result.contents[0].uri).toBe('cngx://tokens');
    expect(bodyOf<{ name: string }[]>(result)).toContainEqual({
      name: 'CNGX_SELECT_CONFIG',
      file: 'projects/forms/select/shared/select-config.ts',
      description: 'DI override for select-family defaults.',
    });
  });
});

describe('readProvenance (cngx://provenance)', () => {
  it('serves the snapshot meta', () => {
    const result = readProvenance(docs);

    expect(result.contents[0].uri).toBe('cngx://provenance');
    expect(bodyOf(result)).toEqual(docs.meta);
    expect(docs.meta.schemaVersion).toBe(2);
    expect(docs.meta.cngxVersion).toBe('0.1.0-rc.6');
  });
});

describe('readApi (cngx://api/{name})', () => {
  it('resolves a known name to its API JSON', () => {
    const result = readApi(docs, 'CngxSelect', 'cngx://api/CngxSelect');

    expect(result.contents[0].uri).toBe('cngx://api/CngxSelect');
    expect(bodyOf<{ name: string }>(result).name).toBe('CngxSelect');
  });

  it('returns an empty resource for an unknown name', () => {
    const result = readApi(docs, 'CngxNope', 'cngx://api/CngxNope');

    expect(result.contents).toEqual([]);
  });
});

describe('completeApiName (cngx://api/{name} autocomplete)', () => {
  it('offers the whole surface, sorted, for an empty partial', () => {
    expect(completeApiName(docs, '')).toEqual(['CngxAccordionItem', 'CngxRipple', 'CngxSelect']);
  });

  it('filters by case-insensitive substring', () => {
    expect(completeApiName(docs, 'sel')).toEqual(['CngxSelect']);
    expect(completeApiName(docs, 'CNGX')).toEqual([
      'CngxAccordionItem',
      'CngxRipple',
      'CngxSelect',
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(completeApiName(docs, 'zzz')).toEqual([]);
  });
});

describe('readLlms (cngx://llms)', () => {
  it('serves the llms.txt index as text/markdown, echoing the uri', () => {
    const result = readLlms(docs);

    expect(result.contents[0].uri).toBe('cngx://llms');
    expect(result.contents[0].mimeType).toBe('text/markdown');
  });

  it('breaks the documented-exports count down per kind from the DocsIndex array lengths', () => {
    const body = readLlms(docs).contents[0].text ?? '';
    const total =
      docs.components.length + docs.directives.length + docs.tokens.length + docs.functions.length;

    expect(body).toContain(
      `${total} documented exports (${docs.components.length} components, ${docs.directives.length} directives, ` +
        `${docs.tokens.length} tokens, ${docs.functions.length} functions).`,
    );
  });

  it('carries the API-reference pointer links against the documented base URL', () => {
    const body = readLlms(docs).contents[0].text ?? '';

    expect(body).toContain('https://cngxjs.github.io/cngx/llms-full.txt');
    expect(body).toContain('https://cngxjs.github.io/cngx/examples/');
  });

  it('lists at least one @cngx/* package', () => {
    const body = readLlms(docs).contents[0].text ?? '';

    expect(body).toMatch(/- \[@cngx\/[a-z-]+\]/);
  });
});
