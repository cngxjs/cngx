// Source of expected values: the compound selectors recorded in the bundled
// snapshot (`CngxCheckbox` is `cngx-checkbox, [cngxCheckbox]`, `CngxButton` is
// `button[cngxButton], a[cngxButton]`) and the name-before-selector rule of
// `resolveEntry`.
import { describe, expect, it } from 'vitest';
import type { DocsIndex } from './data/loader.js';
import type { DocEntry } from './data/types.js';
import { resolveEntry } from './query.js';

function docsOf(components: DocEntry[], directives: DocEntry[] = []): DocsIndex {
  return {
    meta: { schemaVersion: 6, cngxVersion: null, generatedAt: null, compodocxVersion: null },
    components,
    directives,
    injectables: [],
    tokens: [],
    functions: [],
  };
}

const docs = docsOf(
  [{ name: 'CngxCheckbox', selector: 'cngx-checkbox, [cngxCheckbox]' }],
  [
    { name: 'CngxButton', selector: 'button[cngxButton], a[cngxButton]' },
    { name: 'CngxShadow', selector: '[CngxRipple]' },
    { name: 'CngxRipple', selector: '[cngxRipple]' },
  ],
);

describe('resolveEntry', () => {
  it.each(['cngx-checkbox', '[cngxCheckbox]', 'cngxCheckbox', ' CNGX-CHECKBOX '])('resolves %j to CngxCheckbox', (needle) => {
    expect(resolveEntry(docs, needle)?.entry.name).toBe('CngxCheckbox');
  });

  it.each(['button[cngxButton]', 'a[cngxButton]', 'cngxButton', '[cngxButton]'])('resolves %j to CngxButton', (needle) => {
    expect(resolveEntry(docs, needle)?.entry.name).toBe('CngxButton');
  });

  it('prefers a name match over another entry whose selector part matches', () => {
    expect(resolveEntry(docs, 'CngxRipple')?.entry.name).toBe('CngxRipple');
  });

  it('does not match a fragment of a selector part', () => {
    expect(resolveEntry(docs, 'checkbox')).toBeUndefined();
    expect(resolveEntry(docs, 'button')).toBeUndefined();
  });
});
