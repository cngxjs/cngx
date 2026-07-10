import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';

/**
 * A polite `aria-live` region for the visible-row count of a
 * {@link CngxDataGridAccordion}. The consumer feeds the count it already derived
 * (`[cngxDgaCount]="visibleRows().length"`); the directive makes its host a
 * `role="status"` / `aria-live="polite"` / `aria-atomic="true"` region and writes the
 * count text into it, so a filter that changes the count is announced to assistive tech
 * without the consumer wiring a live region by hand (Pillar 2 - the count change is
 * communicated, always in the DOM, content reactive).
 *
 * The host owns its text, so give it an empty element:
 *
 * ```html
 * <cngx-dga-footer>
 *   <span [cngxDgaCount]="visibleRows().length"></span>
 * </cngx-dga-footer>
 * ```
 *
 * The noun is English by default (`result` / `results`); a consumer localises via
 * `cngxDgaCountSingular` / `cngxDgaCountPlural`.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-count.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgaFilter
 */
@Directive({
  selector: '[cngxDgaCount]',
  exportAs: 'cngxDgaCount',
  standalone: true,
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    class: 'cngx-dga-count',
  },
})
export class CngxDgaCount {
  /** The visible-row count the consumer derived. */
  readonly count = input.required<number>({ alias: 'cngxDgaCount' });
  /** Singular noun for a count of 1. English default. */
  readonly singular = input('result', { alias: 'cngxDgaCountSingular' });
  /** Plural noun for any other count. English default. */
  readonly plural = input('results', { alias: 'cngxDgaCountPlural' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  constructor() {
    // Imperative DOM sync of the announced text - a side effect, no signal write.
    effect(() => {
      const count = this.count();
      const noun = count === 1 ? this.singular() : this.plural();
      this.renderer.setProperty(this.element, 'textContent', `${count} ${noun}`);
    });
  }
}
