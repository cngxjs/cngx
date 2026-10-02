import { describe, expect, it } from 'vitest';
import type { CngxPartialSections, CngxPluralMessage } from './language-pack';

interface FixturePack {
  readonly card: { readonly selected: string; readonly count: CngxPluralMessage };
  readonly menu: {
    readonly close: string;
    readonly status: { readonly done: string; readonly error: string };
  };
  readonly extra?: { readonly label: string };
}

type Partial = CngxPartialSections<FixturePack>;

// Type cases are compile-checked assignments: the spec builder does not
// type-check `expectTypeOf`, so only a failed assignment or an unused
// `@ts-expect-error` can turn a broken type red.
describe('CngxPartialSections', () => {
  it('makes every section optional', () => {
    const cases: Partial[] = [{}, { menu: { close: 'Schließen' } }];
    expect(cases).toHaveLength(2);
  });

  it('makes every key of a section optional', () => {
    const cases: Partial[] = [{ card: {} }, { card: { selected: 'Ausgewählt' } }];
    expect(cases).toHaveLength(2);
  });

  it('keeps a given plural message whole', () => {
    const whole: Partial = { card: { count: { other: '{count} Fehler' } } };
    // @ts-expect-error -- a plural message always carries other
    const withoutOther: Partial = { card: { count: { one: '{count} Fehler' } } };
    expect([whole, withoutOther]).toHaveLength(2);
  });

  it('keeps a given record value whole, with no undefined entry', () => {
    const whole: Partial = { menu: { status: { done: 'Fertig', error: 'Fehler' } } };
    // @ts-expect-error -- a record value names every entry
    const missing: Partial = { menu: { status: { done: 'Fertig' } } };
    // @ts-expect-error -- a record entry is never undefined
    const undefinedEntry: Partial = { menu: { status: { done: 'Fertig', error: undefined } } };
    expect([whole, missing, undefinedEntry]).toHaveLength(3);
  });

  it('keeps the keys of an optional section', () => {
    const cases: Partial[] = [{ extra: {} }, { extra: { label: 'Etikett' } }];
    // @ts-expect-error -- an optional section keeps its key types
    const wrongType: Partial = { extra: { label: 1 } };
    expect([...cases, wrongType]).toHaveLength(3);
  });

  it('rejects keys the full pack does not have', () => {
    // @ts-expect-error -- a section key keeps its type
    const wrongType: Partial = { card: { selected: 1 } };
    // @ts-expect-error -- no key outside the full pack
    const unknownKey: Partial = { card: { unknown: 'x' } };
    expect([wrongType, unknownKey]).toHaveLength(2);
  });
});
