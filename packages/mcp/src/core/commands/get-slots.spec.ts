import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadBundledDocs, loadDocsFromFile } from '../data/loader.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocSlot } from '../data/types.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, createDocsResolver } from '../data/docs-resolver.js';
import type { SlotsResult } from './get-slots.js';
import { getSlots as getSlotsAnswer, slotsMarkdown } from './get-slots.js';
import { normalizeSlot } from '../data/slots.js';
import { isAmbiguous } from '../query.js';

/** The query answer for a name that must not be ambiguous. */
function getSlots(...args: Parameters<typeof getSlotsAnswer>): SlotsResult | null {
  const answer = getSlotsAnswer(...args);
  if (isAmbiguous(answer)) {
    throw new Error(`unexpected ambiguity for ${args[1]}`);
  }
  return answer;
}

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

// compodocx records a multi-line `@slot` body as the name with an empty description;
// 24 slots in the 0.1.0-rc.9 bundled snapshot have this shape.
describe('slot names that carry their description', () => {
  const malformed = {
    name: "cngxX Rendered when the item's content failed.\n\n<example-url>http://localhost:4200/#/a</example-url>\n<example-url>http://localhost:4200/#/b</example-url>",
    description: '',
  };

  it('splits the name at the first whitespace and strips example urls from the rest', () => {
    expect(normalizeSlot(malformed)).toEqual({ name: 'cngxX', description: "Rendered when the item's content failed." });
  });

  it('keeps a recorded description over the rest of the name', () => {
    expect(normalizeSlot({ name: 'cngxX trailing text', description: 'Recorded.' })).toEqual({ name: 'cngxX', description: 'Recorded.' });
  });

  it('leaves a well-formed slot untouched', () => {
    const slot = { name: 'cngxX', description: 'Fine.' };

    expect(normalizeSlot(slot)).toEqual(slot);
  });

  it.each([[null], [{ description: 'No name.' }], [{ name: '  ', description: 'Blank.' }], [{ name: 42, description: 'x' }]])(
    'drops the unusable slot %j',
    (slot) => {
      expect(normalizeSlot(slot)).toBeNull();
    },
  );

  it('answers only the valid slots of a list with a null slot and a nameless one', () => {
    const slots = [null, { description: 'No name.' }, { name: 'cngxOk', description: 'Fine.' }] as unknown as DocSlot[];
    const index: DocsIndex = { ...docs, components: [{ name: 'CngxX', slots }] };

    expect(getSlots(index, 'CngxX')?.slots).toEqual([{ name: 'cngxOk', description: 'Fine.' }]);
  });

  it('answers no slots when slots is not a list', () => {
    const index: DocsIndex = { ...docs, components: [{ name: 'CngxX', slots: {} as unknown as DocSlot[] }] };

    expect(getSlots(index, 'CngxX')?.slots).toEqual([]);
  });

  it('answers the normalised slot', () => {
    const index: DocsIndex = { ...docs, components: [{ name: 'CngxX', slots: [malformed] }] };

    expect(getSlots(index, 'CngxX')?.slots).toEqual([{ name: 'cngxX', description: "Rendered when the item's content failed." }]);
  });

  it('prints no localhost url for CngxAccordionItem from the bundled snapshot', () => {
    const bundled = loadBundledDocs(fileURLToPath(new URL('../../../data/', import.meta.url)));
    const markdown = slotsMarkdown(getSlots(bundled, 'CngxAccordionItem'));

    expect(markdown).toContain('`cngxAccordionItemError`');
    expect(markdown).not.toContain('localhost');
  });
});
