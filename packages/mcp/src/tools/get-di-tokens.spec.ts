import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getDiTokens } from './get-di-tokens.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getDiTokens', () => {
  it('returns the full DI token list with no argument', () => {
    const tokens = getDiTokens(docs);

    expect(tokens.map((t) => t.name)).toContain('CNGX_SELECT_CONFIG');
  });

  it('filters the DI token list by a name fragment (case-insensitive)', () => {
    const tokens = getDiTokens(docs, 'select_config');

    expect(tokens).toHaveLength(1);
    expect(tokens[0].name).toBe('CNGX_SELECT_CONFIG');
  });

  it('returns an empty list when nothing matches', () => {
    expect(getDiTokens(docs, 'no-such-token')).toEqual([]);
  });
});
