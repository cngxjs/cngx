import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, createDocsResolver, resetDocsCache } from '../data/docs-resolver.js';
import { getSlots } from './get-slots.js';

const FIXTURE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getSlots', () => {
  it('returns the projected slots as { name, description } pairs', () => {
    const result = getSlots(docs, 'CngxSelect');

    expect(result).toMatchObject({ name: 'CngxSelect', kind: 'component' });
    expect(result?.slots).toEqual([
      { name: 'cngxSelectCaret', description: 'Replaces the trigger caret glyph.' },
      { name: 'cngxSelectEmpty', description: 'Rendered when no options match.' },
    ]);
  });

  it('returns an empty slots array for a component with no slots', () => {
    expect(getSlots(docs, 'CngxRipple')?.slots).toEqual([]);
  });

  it('returns null for an unknown name', () => {
    expect(getSlots(docs, 'CngxDoesNotExist')).toBeNull();
  });
});

describe('get_slots version wiring', () => {
  beforeEach(() => resetDocsCache());

  it('grounds the answer against a fetched non-bundled version', async () => {
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '0.2.0', (resolved) => getSlots(resolved, 'CngxSelect'));

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    // v0.2.0 dropped the `cngxSelectEmpty` slot the bundled snapshot still lists.
    const result = (answer as { result: { slots: { name: string }[] } }).result;
    expect(result.slots.map((s) => s.name)).toEqual(['cngxSelectCaret']);
  });

  it('passes a fetch failure through as a typed result', async () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: async () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = await answerVersioned(createDocsResolver(docs, deps), '999.0.0', (resolved) => getSlots(resolved, 'CngxSelect'));

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
