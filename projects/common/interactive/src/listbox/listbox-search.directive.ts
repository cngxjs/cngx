import { Directive, inject, input } from '@angular/core';

import { type ActiveDescendantItem } from '@cngx/common/a11y';

import { CngxSearch } from '../keyboard/search.directive';

/** Matcher function used by CngxListboxSearch to filter options. */
export type ListboxMatchFn = (option: ActiveDescendantItem, term: string) => boolean;

const defaultLabelMatch: ListboxMatchFn = (option, term) => {
  if (term === '') {
    return true;
  }
  return option.label.toLowerCase().includes(term.toLowerCase());
};

/**
 * Search input for a `CngxListbox`.
 *
 * Builds on `CngxSearch` via `hostDirectives` — inherits debounce, term
 * tracking, and clear semantics. Adds a `matchFn` input that listboxes read
 * to filter their options. A listbox that has a `CngxListboxSearch` injected
 * ancestor reads `term` and `matchFn` from it reactively.
 *
 * @category interactive
 */
@Directive({
  selector: 'input[cngxListboxSearch]',
  exportAs: 'cngxListboxSearch',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxSearch,
      inputs: ['debounceMs'],
    },
  ],
})
export class CngxListboxSearch {
  /** Custom matcher. Defaults to case-insensitive substring match on `label`. */
  readonly matchFn = input<ListboxMatchFn>(defaultLabelMatch);

  private readonly search = inject(CngxSearch, { self: true, host: true });

  /** Current debounced search term (proxied from CngxSearch). */
  readonly term = this.search.term;

  /** True when term is non-empty. */
  readonly hasValue = this.search.hasValue;

  /** Clears the input. */
  clear(): void {
    this.search.clear();
  }
}
