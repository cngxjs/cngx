import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile, type DocsIndex } from '../data/loader.js';
import type { ComponentSummary } from '../tools/list-components.js';
import {
  completeApiName,
  readApi,
  readCatalog,
  readLlms,
  readLlmsFull,
  readProvenance,
  readTokens,
} from './register-resources.js';
import { DEFAULT_BASE_URL, readPackages } from '../../../../scripts/llms-publish.mjs';

const FIXTURE = fileURLToPath(
  new URL('../../test/fixtures/documentation.sample.json', import.meta.url),
);
const LLM_DUMP_FIXTURE = fileURLToPath(
  new URL('../../test/fixtures/llm-context.sample.md', import.meta.url),
);
const docs = loadDocsFromFile(FIXTURE);

// Repo root is four levels up from this spec (src/resources -> src -> mcp -> packages -> root).
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

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

  it("carries the API-reference pointer links against the build script's base URL", () => {
    const body = readLlms(docs).contents[0].text ?? '';

    expect(body).toContain(`${DEFAULT_BASE_URL}/llms-full.txt`);
    expect(body).toContain(`${DEFAULT_BASE_URL}/examples/`);
  });

  it('mirrors the published package list llms-publish.mjs derives from projects/*', async () => {
    const body = readLlms(docs).contents[0].text ?? '';
    const published = await readPackages(resolve(REPO_ROOT, 'projects'));

    // The static CNGX_PACKAGES mirror must match the build-time derivation exactly -
    // same set, same descriptions - or the offline index drifts from the published llms.txt.
    expect(published.length).toBeGreaterThan(0);
    for (const pkg of published) {
      expect(body).toContain(
        `- [${pkg.name}](https://www.npmjs.com/package/${pkg.name}): ${pkg.description}`,
      );
    }

    // No stale or extra entries: the emitted @cngx/* line count equals the derived set.
    const emitted = (body.match(/^- \[@cngx\//gm) ?? []).length;
    expect(emitted).toBe(published.length);
  });
});

describe('readLlmsFull (cngx://llms-full)', () => {
  const dump = readFileSync(LLM_DUMP_FIXTURE, 'utf8');

  it('serves the dump as text/markdown, echoing the uri', () => {
    const result = readLlmsFull(dump);

    expect(result.contents[0].uri).toBe('cngx://llms-full');
    expect(result.contents[0].mimeType).toBe('text/markdown');
  });

  it('returns the dump verbatim - byte-identical, no second projection', () => {
    const body = readLlmsFull(dump).contents[0].text ?? '';

    expect(body).toBe(dump);
    // The llm-md structural markers survive untouched.
    expect(body).toContain('# ');
    expect(body).toContain('> Generated by');
    expect(body).toContain('## ');
    expect(body).toContain('### ');
  });

  it('degrades to an empty resource when no dump is bundled', () => {
    expect(readLlmsFull(null).contents).toEqual([]);
  });
});
