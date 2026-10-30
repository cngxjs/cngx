// Source of expected values: the compound selectors recorded in the bundled
// snapshot (`CngxCheckbox` is `cngx-checkbox, [cngxCheckbox]`, `CngxButton` is
// `button[cngxButton], a[cngxButton]`, `CngxFormBridge` lists
// `input[cngxInputMask][formControl]` next to `CngxInputMask`'s
// `input[cngxInputMask]`, both breadcrumb sync directives carry
// `[cngxRouterSync]`) and the ranking rule of `resolveEntry`.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { DocsIndex } from './data/loader.js';
import { loadBundledDocs } from './data/loader.js';
import type { DocEntry } from './data/types.js';
import type { AmbiguousMatch, KindedEntry } from './query.js';
import { isAmbiguous, resolveEntry } from './query.js';
import { shuffled } from '../testing/shuffle.js';

const BUNDLED_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

/** The resolved name, or the candidate names of an ambiguity, so two answers compare by value. */
function answerOf(match: KindedEntry | AmbiguousMatch | undefined): string | string[] | undefined {
  if (isAmbiguous(match)) {
    return match.candidates.map((candidate) => candidate.name);
  }
  return match?.entry.name;
}

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
    expect(answerOf(resolveEntry(docs, needle))).toBe('CngxCheckbox');
  });

  it.each(['button[cngxButton]', 'a[cngxButton]', 'cngxButton', '[cngxButton]'])('resolves %j to CngxButton', (needle) => {
    expect(answerOf(resolveEntry(docs, needle))).toBe('CngxButton');
  });

  it('prefers a name match over another entry whose selector part matches', () => {
    expect(answerOf(resolveEntry(docs, 'CngxRipple'))).toBe('CngxRipple');
  });

  it('does not match a fragment of a selector part', () => {
    expect(resolveEntry(docs, 'checkbox')).toBeUndefined();
    expect(resolveEntry(docs, 'button')).toBeUndefined();
  });
});

describe('resolveEntry ranks selector matches', () => {
  const ranked = docsOf(
    [],
    [
      { name: 'CngxBridge', selector: 'input[cngxMask][formControl], [cngxChip][formControl], cngx-toggle[formControl]' },
      { name: 'CngxMask', selector: 'input[cngxMask]' },
      { name: 'CngxChip', selector: '[cngxChip]' },
      { name: 'CngxSyncB', selector: 'cngx-b[cngxSync]' },
      { name: 'CngxSyncA', selector: 'cngx-a[cngxSync]' },
    ],
  );

  it('prefers a sole attribute over the leading attribute of a compound part', () => {
    expect(answerOf(resolveEntry(ranked, '[cngxMask]'))).toBe('CngxMask');
    expect(answerOf(resolveEntry(ranked, 'cngxMask'))).toBe('CngxMask');
  });

  it('prefers an exact selector part over a compound part', () => {
    expect(answerOf(resolveEntry(ranked, '[cngxChip]'))).toBe('CngxChip');
  });

  it('never keys a refining attribute', () => {
    expect(answerOf(resolveEntry(ranked, '[formControl]'))).toBe('CngxBridge');
    expect(answerOf(resolveEntry(docsOf([], [{ name: 'CngxOnly', selector: 'input[cngxMask][formControl]' }]), 'formControl'))).toBeUndefined();
  });

  it('answers a tie on the best rank with every candidate, sorted by name', () => {
    expect(resolveEntry(ranked, 'cngxSync')).toEqual({
      ambiguous: true,
      candidates: [
        { name: 'CngxSyncA', kind: 'directive', selector: 'cngx-a[cngxSync]' },
        { name: 'CngxSyncB', kind: 'directive', selector: 'cngx-b[cngxSync]' },
      ],
    });
  });
});

describe('resolveEntry over the bundled snapshot', () => {
  const bundled = loadBundledDocs(BUNDLED_DIR);

  it.each([
    ['[cngxInputMask]', 'CngxInputMask'],
    ['[cngxNumericInput]', 'CngxNumericInput'],
    ['[cngxInputFormat]', 'CngxInputFormat'],
    ['[cngxChipInteraction]', 'CngxChipInteraction'],
    ['[cngxError]', 'CngxError'],
  ])('resolves %j to %s', (needle, name) => {
    expect(answerOf(resolveEntry(bundled, needle))).toBe(name);
  });

  // A name match wins over another entry's bare attribute; the bracketed attribute names its own directive.
  it.each([
    ['cngxStepper', 'CngxStepper'],
    ['[cngxStepper]', 'CngxStepperPresenter'],
    ['cngxTabGroup', 'CngxTabGroup'],
    ['[cngxTabGroup]', 'CngxTabGroupPresenter'],
  ])('resolves the name/attribute split %j to %s', (needle, name) => {
    expect(answerOf(resolveEntry(bundled, needle))).toBe(name);
  });

  it.each(['cngxRouterSync', '[cngxRouterSync]'])('answers %j as ambiguous between the breadcrumb sync directives', (needle) => {
    expect(answerOf(resolveEntry(bundled, needle))).toEqual(['CngxBreadcrumbRouterSync', 'CngxBreadcrumbSiblingsRouterSync']);
  });

  // Every key two or more entries share: each selector part and each attribute, bracketed and bare.
  const shared = (): string[] => {
    const owners = new Map<string, Set<string>>();
    for (const entry of [...bundled.components, ...bundled.directives]) {
      for (const part of (entry.selector ?? '').toLowerCase().split(',')) {
        const keys = [part.trim(), ...[...part.matchAll(/\[\s*([^\]=\s]+)[^\]]*\]/g)].flatMap(([, attr]) => [`[${attr}]`, attr])];
        for (const key of keys.filter((k) => k !== '')) {
          owners.set(key, (owners.get(key) ?? new Set()).add(entry.name));
        }
      }
    }
    return [...owners].filter(([, names]) => names.size > 1).map(([key]) => key);
  };

  const reorder = (order: <T>(items: readonly T[]) => T[]): DocsIndex => ({
    ...bundled,
    components: order(bundled.components),
    directives: order(bundled.directives),
    injectables: order(bundled.injectables),
  });

  it('finds keys shared by several entries to check', () => {
    expect(shared().length).toBeGreaterThan(10);
  });

  it('resolves every candidate of every bundled ambiguity by its class name to exactly that candidate', () => {
    const ambiguities = shared()
      .map((key) => resolveEntry(bundled, key))
      .filter((match): match is AmbiguousMatch => isAmbiguous(match));

    expect(ambiguities.length).toBeGreaterThan(0);
    for (const { candidates } of ambiguities) {
      for (const candidate of candidates) {
        const match = resolveEntry(bundled, candidate.name);

        expect(isAmbiguous(match) ? undefined : { name: match?.entry.name, kind: match?.kind }, candidate.name).toEqual({
          name: candidate.name,
          kind: candidate.kind,
        });
      }
    }
  });

  it('answers every shared key the same for the original, reversed and shuffled entry lists', () => {
    const orders = [
      reorder((items) => [...items].reverse()),
      ...[1, 2, 3].map((seed) => reorder((items) => shuffled(items, seed))),
    ];
    for (const key of shared()) {
      const expected = answerOf(resolveEntry(bundled, key));
      for (const index of orders) {
        expect(answerOf(resolveEntry(index, key)), key).toEqual(expected);
      }
    }
  });
});
