import { Directive, effect, ElementRef, inject, input, Renderer2, untracked } from '@angular/core';

import {
  CNGX_DATA_GRID_ACCORDION_LABELS_DEFAULTS,
  injectDataGridAccordionLabels,
} from './config/data-grid-accordion.config.defaults';

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
 *   <span cngxDgaCell [cngxDgaCount]="visibleRows().length"></span>
 * </cngx-dga-footer>
 * ```
 *
 * `cngxDgaCell` puts the count in the first content column alongside every other
 * grid cell. It is not required - the footer already places a bare first child in
 * that column - but it is the consistent form the rest of the grid's cells use.
 *
 * The text is English by default (`3 results`). Localise it app-wide through
 * `withDataGridAccordionLabels`: a `count` formatter owns word order and plural rules,
 * the `countSingular` / `countPlural` nouns alone keep the `<count> <noun>` shape.
 * Binding `cngxDgaCountSingular` / `cngxDgaCountPlural` per instance always composes
 * `<count> <noun>`.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-count.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgaFilter
 *
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/sortable-ledger</example-url>
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
  private readonly labels = injectDataGridAccordionLabels();
  /** Construction-time noun defaults; an input still equal to them is treated as unbound. */
  private readonly nounSnapshot = {
    singular: this.labels().countSingular,
    plural: this.labels().countPlural,
  };

  /**
   * Singular noun for a count of 1. Defaults to the `countSingular` label, read at
   * construction; binding a different noun switches to `<count> <noun>` composition.
   */
  readonly singular = input(this.nounSnapshot.singular, { alias: 'cngxDgaCountSingular' });
  /**
   * Plural noun for any other count. Defaults to the `countPlural` label, read at
   * construction; binding a different noun switches to `<count> <noun>` composition.
   */
  readonly plural = input(this.nounSnapshot.plural, { alias: 'cngxDgaCountPlural' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  constructor() {
    // Imperative DOM sync of the announced text - a side effect, no signal write. The
    // labels read is untracked: the host is a live region, and a copy flip must not
    // re-speak a shown count; the next count change speaks the new language.
    effect(() => {
      const count = this.count();
      const singular = this.singular();
      const plural = this.plural();
      const text = untracked(() => {
        const unbound =
          singular === this.nounSnapshot.singular && plural === this.nounSnapshot.plural;
        if (!unbound) {
          return `${count} ${count === 1 ? singular : plural}`;
        }
        const labels = this.labels();
        // A consumer `count` formatter owns word order and plurals; otherwise the
        // resolved noun labels compose, so a nouns-only override still reaches AT.
        if (labels.count !== CNGX_DATA_GRID_ACCORDION_LABELS_DEFAULTS.count) {
          return labels.count(count);
        }
        return `${count} ${count === 1 ? labels.countSingular : labels.countPlural}`;
      });
      this.renderer.setProperty(this.element, 'textContent', text);
    });
  }
}
