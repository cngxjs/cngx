import { describe, expectTypeOf, it } from 'vitest';
import type { CngxPartialSections, CngxPluralMessage } from './language-pack';

interface FixturePack {
  readonly card: { readonly selected: string; readonly count: CngxPluralMessage };
  readonly menu: { readonly close: string };
  readonly extra?: { readonly label: string };
}

type Partial = CngxPartialSections<FixturePack>;

describe('CngxPartialSections', () => {
  it('makes every section optional', () => {
    expectTypeOf<{}>().toExtend<Partial>();
    expectTypeOf<{ menu: { close: string } }>().toExtend<Partial>();
  });

  it('makes every key of a section optional', () => {
    expectTypeOf<{ card: {} }>().toExtend<Partial>();
    expectTypeOf<{ card: { selected: string } }>().toExtend<Partial>();
  });

  it('keeps a given plural message whole', () => {
    expectTypeOf<{ card: { count: { other: string } } }>().toExtend<Partial>();
    expectTypeOf<{ card: { count: { one: string } } }>().not.toExtend<Partial>();
  });

  it('keeps the keys of an optional section', () => {
    expectTypeOf<{ extra: {} }>().toExtend<Partial>();
    expectTypeOf<{ extra: { label: string } }>().toExtend<Partial>();
    expectTypeOf<{ extra: { label: number } }>().not.toExtend<Partial>();
  });

  it('rejects keys the full pack does not have', () => {
    expectTypeOf<{ card: { selected: number } }>().not.toExtend<Partial>();
  });
});
