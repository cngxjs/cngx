import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, resetDocsCache } from '../data/docs-resolver.js';
import { findComponents } from './find-component.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('findComponents', () => {
  it('matches a component by class name (case-insensitive)', () => {
    const matches = findComponents(docs, 'cngxselect');

    expect(matches.map((m) => m.name)).toContain('CngxSelect');
    const select = matches.find((m) => m.name === 'CngxSelect');
    expect(select).toMatchObject({ kind: 'component', selector: 'cngx-select' });
  });

  it('matches a directive by selector', () => {
    const matches = findComponents(docs, '[cngxripple]');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ name: 'CngxRipple', kind: 'directive' });
  });

  it('matches by category fragment', () => {
    const matches = findComponents(docs, 'accordion');

    expect(matches.map((m) => m.name)).toContain('CngxAccordionItem');
  });

  it('matches an injectable service by name fragment', () => {
    const matches = findComponents(docs, 'toaster');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ name: 'CngxToaster', kind: 'injectable', selector: null });
  });

  it('returns an empty array for an empty query and for no match', () => {
    expect(findComponents(docs, '')).toEqual([]);
    expect(findComponents(docs, 'no-such-symbol')).toEqual([]);
  });
});

describe('find_component version wiring', () => {
  beforeEach(() => resetDocsCache());

  it('grounds the array answer against a fetched non-bundled version', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };

    // `CngxNewPanel` exists only in v0.2.0; the bundled snapshot has no "Panel" match.
    const answer = answerVersioned(docs, '0.2.0', (resolved) => findComponents(resolved, 'Panel'), deps);

    expect(answer).toMatchObject({ ok: true, groundedVersion: '0.2.0' });
    const result = (answer as { result: { name: string }[] }).result;
    expect(result.map((m) => m.name)).toEqual(['CngxNewPanel']);
  });

  it('passes a fetch failure through as a typed result', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: loadDocsFromFile,
    };

    const answer = answerVersioned(docs, '999.0.0', (resolved) => findComponents(resolved, 'Panel'), deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
