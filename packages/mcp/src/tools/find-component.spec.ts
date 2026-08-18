import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { findComponents } from './find-component.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
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

  it('returns an empty array for an empty query and for no match', () => {
    expect(findComponents(docs, '')).toEqual([]);
    expect(findComponents(docs, 'no-such-symbol')).toEqual([]);
  });
});
