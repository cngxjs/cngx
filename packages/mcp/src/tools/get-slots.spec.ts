import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { getSlots } from './get-slots.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));
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
