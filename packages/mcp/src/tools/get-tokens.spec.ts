import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getTokens } from './get-tokens.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getTokens', () => {
  it('returns theming tokens + overview for a resolved component', () => {
    const result = getTokens(docs, 'CngxSelect');

    expect(result.kind).toBe('theme');
    if (result.kind !== 'theme') return;
    expect(result.themeOverview).toContain('CngxSelect family');
    expect(result.themeTokens).toEqual([
      {
        name: '--cngx-select-panel-border',
        kind: 'css-at-property',
        type: '*',
        defaultValue: '1px solid oklch(0.85 0.01 250)',
        description: 'Border shorthand of the dropdown panel.',
      },
    ]);
  });

  it('returns the full DI token list with no argument', () => {
    const result = getTokens(docs);

    expect(result.kind).toBe('di');
    if (result.kind !== 'di') return;
    expect(result.query).toBeNull();
    expect(result.tokens.map((t) => t.name)).toContain('CNGX_SELECT_CONFIG');
  });

  it('filters DI tokens by a non-resolving name fragment', () => {
    const result = getTokens(docs, 'select_config');

    expect(result.kind).toBe('di');
    if (result.kind !== 'di') return;
    expect(result.query).toBe('select_config');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].name).toBe('CNGX_SELECT_CONFIG');
  });
});
