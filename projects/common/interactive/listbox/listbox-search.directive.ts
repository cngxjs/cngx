import { Directive, inject, input, type Signal } from '@angular/core';

import { type ActiveDescendantItem } from '@cngx/common/a11y';
import { foldForMatching, injectLocale } from '@cngx/core/utils';

import { CngxSearch } from '../keyboard/search.directive';

/**
 * Matcher function used by CngxListboxSearch to filter options.
 *
 * @category common/interactive/listbox
 */
export type ListboxMatchFn = (option: ActiveDescendantItem, term: string) => boolean;

/** @internal Accent- and case-tolerant substring match in the app locale. */
function labelMatchFor(locale: Signal<string>): ListboxMatchFn {
  return (option, term) => {
    if (term === '') {
      return true;
    }
    const current = locale();
    return foldForMatching(option.label, current).includes(foldForMatching(term, current));
  };
}

/**
 * Search input for a `CngxListbox`.
 *
 * Builds on `CngxSearch` via `hostDirectives` - inherits debounce, term
 * tracking, and clear semantics. Adds a `matchFn` input that listboxes read
 * to filter their options. A listbox that has a `CngxListboxSearch` injected
 * ancestor reads `term` and `matchFn` from it reactively.
 *
 * @category common/interactive/listbox
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/listbox-search.directive.ts
 * @since 0.1.0
 * @relatedTo CngxListbox, CngxSearch, CngxListboxTrigger
 * <example-url>http://localhost:4200/#/common/interactive/listbox/search/command-palette</example-url>
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
  /**
   * Custom matcher. Defaults to a substring match on `label` that ignores
   * case and accents in the app locale.
   */
  readonly matchFn = input<ListboxMatchFn>(labelMatchFor(injectLocale()));

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
