import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, resetDocsCache } from '../data/docs-resolver.js';
import { getDiTokens } from './get-di-tokens.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
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

describe('get_di_tokens version wiring', () => {
  beforeEach(() => resetDocsCache());

  it('grounds the array answer against a fetched non-bundled version', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = answerVersioned(docs, '0.2.0', (resolved) => getDiTokens(resolved), deps);

    // Array-returning tool: the version rides the envelope, not the payload.
    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    const result = (answer as { result: { name: string }[] }).result;
    expect(result.map((t) => t.name)).toContain('CNGX_SELECT_CONFIG');
  });

  it('passes a fetch failure through as a typed result', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = answerVersioned(docs, '999.0.0', (resolved) => getDiTokens(resolved), deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
