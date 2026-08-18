import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getThemeTokens } from './get-theme-tokens.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
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
