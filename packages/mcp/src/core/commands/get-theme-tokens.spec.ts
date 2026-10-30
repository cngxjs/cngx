import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, createDocsResolver } from '../data/docs-resolver.js';
import type { ThemeTokensResult } from './get-theme-tokens.js';
import { getThemeTokens as getThemeTokensAnswer, getThemeTokensCommand } from './get-theme-tokens.js';
import { isAmbiguous } from '../query.js';

/** The query answer for a name that must not be ambiguous. */
function getThemeTokens(...args: Parameters<typeof getThemeTokensAnswer>): ThemeTokensResult | null {
  const answer = getThemeTokensAnswer(...args);
  if (isAmbiguous(answer)) {
    throw new Error(`unexpected ambiguity for ${args[1]}`);
  }
  return answer;
}

const FIXTURE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
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

  it('grounds the answer against a fetched non-bundled version', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '0.2.0', (resolved) => getThemeTokens(resolved, 'CngxSelect'));

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    // v0.2.0 exposes no theme tokens; the bundled snapshot lists one.
    const result = (answer as { result: { themeTokens: unknown[] } }).result;
    expect(result.themeTokens).toEqual([]);
  });

  it('passes a fetch failure through as a typed result', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '999.0.0', (resolved) => getThemeTokens(resolved, 'CngxSelect'));

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});

describe('get_theme_tokens input schema', () => {
  const schema = z.object(getThemeTokensCommand.input);

  it('rejects a blank name as invalid input', () => {
    expect(schema.safeParse({ name: ' ' }).success).toBe(false);
    expect(schema.safeParse({ name: '\t' }).success).toBe(false);
  });

  it('trims a padded name before the query sees it', () => {
    expect(schema.parse({ name: ' CngxSelect ' }).name).toBe('CngxSelect');
  });
});
