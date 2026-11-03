import { describe, expect, it } from 'vitest';

import type { CngxSelectMatchFn } from '../config';
import { toListboxMatchFn } from './listbox-match';

describe('toListboxMatchFn', () => {
  it('returns the matcher reference unchanged, so the listbox input only moves with it', () => {
    const match: CngxSelectMatchFn<string> = (option, term) => option.label.startsWith(term);
    expect(toListboxMatchFn(match)).toBe(match);
    expect(toListboxMatchFn(match)).toBe(toListboxMatchFn(match));
  });

  it('matches a listbox item through the select matcher', () => {
    const match: CngxSelectMatchFn<string> = (option, term) =>
      option.value === 'red' && option.label.toLowerCase().startsWith(term);
    const listboxMatch = toListboxMatchFn(match) as unknown as (
      item: { value: unknown; label: string },
      term: string,
    ) => boolean;
    expect(listboxMatch({ value: 'red', label: 'Red' }, 're')).toBe(true);
    expect(listboxMatch({ value: 'green', label: 'Red' }, 're')).toBe(false);
  });
});
