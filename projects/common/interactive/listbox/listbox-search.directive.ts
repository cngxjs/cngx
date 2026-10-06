import { Directive, inject, input, type Signal } from '@angular/core';

import { type ActiveDescendantItem } from '@cngx/common/a11y';
import { createLabelMatcher, injectLocale } from '@cngx/core/utils';

import { CngxSearch } from '../keyboard/search.directive';

/**
 * Matcher function used by CngxListboxSearch to filter options.
 *
 * @category common/interactive/listbox
 */
export type ListboxMatchFn = (option: ActiveDescendantItem, term: string) => boolean;

/**
 * The default listbox matcher: an accent- and case-tolerant substring match
 * of `option.label` against the term in the locale `locale` holds, built on
 * {@link createLabelMatcher}. The option object is the cache key, so each
 * label is folded once per label text and locale; the cache is a `WeakMap`
 * owned by the returned function and never outlives the options. An empty
 * term matches every option.
 *
 * Reach for it when a component filters `ActiveDescendantItem`s and wants the
 * same match a `CngxListboxSearch` applies by default, e.g. as the last arm
 * of an `input() ?? config ?? default` cascade. Create it once per host in an
 * injection context (field initializer) so the cache lives as long as the host.
 *
 * ```typescript
 * private readonly labelMatch = createListboxLabelMatch(injectLocale());
 * protected readonly matchFn = computed(() => this.matchFnInput() ?? this.labelMatch);
 * ```
 *
 * @category common/interactive
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/listbox-search.directive.ts
 * @since 0.1.0
 * @relatedTo createLabelMatcher, CngxListboxSearch
 */
export function createListboxLabelMatch(locale: Signal<string>): ListboxMatchFn {
  const matches = createLabelMatcher(locale);
  return (option, term) => matches(option.label, term, option);
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
  readonly matchFn = input<ListboxMatchFn>(createListboxLabelMatch(injectLocale()));

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
