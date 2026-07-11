import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';

import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';

/**
 * Turns a projected `<input>` into the filter box for the {@link CngxDataGridAccordion}
 * it lives in: it two-way-binds the group's `filterTerm` with no wiring. On each
 * keystroke it writes the value into `grid.filterTerm` after a debounce (owned here -
 * {@link CngxFilter} has none), so the consumer's `computed()` re-derives the visible
 * rows only once typing settles. An external term change (a programmatic clear) reflects
 * back into the box, but never while it is focused - that would fight the caret.
 *
 * The debounce lives in this slot, not in the group, because it is an input-UX concern;
 * a consumer driving the term programmatically writes `grid.filterTerm` directly with no
 * debounce. The default `aria-label` is English (a consumer overrides via
 * `cngxDgaFilterLabel`).
 *
 * ```html
 * <cngx-data-grid-accordion>
 *   <cngx-dga-header>
 *     <input cngxDgaFilter cngxDgaFilterLabel="Filter invoices" />
 *   </cngx-dga-header>
 *   <!-- rows rendered by the consumer's @for over its filtered array -->
 * </cngx-data-grid-accordion>
 * ```
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-filter.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxFilter, CngxDgaCount
 *
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/bound-sort-filter</example-url>
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/sortable-ledger</example-url>
 */
@Directive({
  selector: 'input[cngxDgaFilter]',
  exportAs: 'cngxDgaFilter',
  standalone: true,
  host: {
    role: 'searchbox',
    class: 'cngx-dga-filter',
    '[attr.aria-label]': 'ariaLabel()',
    '(input)': 'handleInput($event)',
  },
})
export class CngxDgaFilter {
  /** Accessible name for the filter box. English default; override for other locales. */
  readonly ariaLabel = input('Filter rows', { alias: 'cngxDgaFilterLabel' });
  /** Debounce in ms between the last keystroke and writing `grid.filterTerm`. */
  readonly debounce = input(200, { alias: 'cngxDgaFilterDebounce' });

  private readonly grid = inject(CNGX_DATA_GRID_ACCORDION);
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    // Reflect an external term change (e.g. a programmatic clear) back into the box, but
    // never while the user is typing into it - overwriting `value` there resets the caret.
    effect(() => {
      const term = this.grid.filterTerm();
      if (document.activeElement !== this.element && this.element.value !== term) {
        this.element.value = term;
      }
    });
  }

  protected handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.grid.filterTerm.set(value), this.debounce());
  }
}
