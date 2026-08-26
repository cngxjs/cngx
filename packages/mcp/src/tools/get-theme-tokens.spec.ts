import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, resetDocsCache } from '../data/docs-resolver.js';
import { getThemeTokens } from './get-theme-tokens.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getThemeTokens', () => {
  it('returns theming tokens + overview for a resolved component', () => {
    const result = getThemeTokens(docs, 'CngxSelect');

    expect(result?.name).toBe('CngxSelect');
    expect(result?.themeOverview).toContain('CngxSelect family');
    expect(result?.themeTokens).toEqual([
      {
        name: '--cngx-select-panel-border',
        kind: 'css-at-property',
        type: '*',
        defaultValue: '1px solid oklch(0.85 0.01 250)',
        description: 'Border shorthand of the dropdown panel.',
      },
    ]);
  });

  it('returns an empty themeTokens array for a component that exposes none', () => {
    expect(getThemeTokens(docs, 'CngxAccordionItem')?.themeTokens).toEqual([]);
  });

  it('returns null for an unknown name', () => {
    expect(getThemeTokens(docs, 'CngxDoesNotExist')).toBeNull();
  });
});

describe('get_theme_tokens version wiring', () => {
  beforeEach(() => resetDocsCache());

  it('grounds the answer against a fetched non-bundled version', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = answerVersioned(docs, '0.2.0', (resolved) => getThemeTokens(resolved, 'CngxSelect'), deps);

    expect(answer).toMatchObject({ groundedVersion: '0.2.0' });
    // v0.2.0 exposes no theme tokens; the bundled snapshot lists one.
    const result = (answer as { result: { themeTokens: unknown[] } }).result;
    expect(result.themeTokens).toEqual([]);
  });

  it('passes a fetch failure through as a typed result', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = answerVersioned(docs, '999.0.0', (resolved) => getThemeTokens(resolved, 'CngxSelect'), deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
