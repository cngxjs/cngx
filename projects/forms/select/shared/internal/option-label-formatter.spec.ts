import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxSelectOptionDef } from '../option.model';
import { createOptionLabelFormatter } from './option-label-formatter';

type Opt = CngxSelectOptionDef<string>;

function setup(initial: readonly Opt[], value: string) {
  const options = signal<readonly Opt[]>(initial);
  const displayWith = signal<((v: string) => string) | undefined>(undefined);
  const formatter = createOptionLabelFormatter<string>(
    displayWith,
    signal(value),
    (v) => options().find((o) => o.value === v) ?? null,
    signal((a: string | undefined, b: string | undefined) => a === b),
  );
  return { options, displayWith, formatter };
}

describe('createOptionLabelFormatter', () => {
  it('writes the label of the selected option', () => {
    const { formatter } = setup([{ value: 'red', label: 'Red' }], 'red');
    expect(formatter()('red')).toBe('Red');
  });

  it('falls back to String(value) when no option matches', () => {
    const { formatter } = setup([{ value: 'blue', label: 'Blue' }], 'red');
    expect(formatter()('red')).toBe('red');
  });

  it('lets a bound displayWith win', () => {
    const { formatter, displayWith } = setup([{ value: 'red', label: 'Red' }], 'red');
    displayWith.set((v) => v.toUpperCase());
    expect(formatter()('red')).toBe('RED');
  });

  it('keeps the same formatter when a refetch returns the same selected option', () => {
    const { formatter, options } = setup([{ value: 'red', label: 'Red' }], 'red');
    const before = formatter();
    options.set([
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ]);
    expect(formatter()).toBe(before);
  });

  it('builds a new formatter when the selected option arrives after the value', () => {
    const { formatter, options } = setup([], 'red');
    expect(formatter()('red')).toBe('red');
    options.set([{ value: 'red', label: 'Red' }]);
    expect(formatter()('red')).toBe('Red');
  });

  it('looks up an argument that is not the committed value', () => {
    const { formatter } = setup(
      [
        { value: 'red', label: 'Red' },
        { value: 'blue', label: 'Blue' },
      ],
      'red',
    );
    expect(formatter()('blue')).toBe('Blue');
  });
});
