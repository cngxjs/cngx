import { Directive, effect, ElementRef, inject, input, Renderer2, untracked } from '@angular/core';

import { coerceSignal } from '@cngx/core/utils';

import { CNGX_DATA_GRID_ACCORDION_CONFIG } from './config/data-grid-accordion.config.defaults';
import { injectDataGridAccordionLabels } from './i18n/data-grid-accordion-i18n';

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
 * The text comes from the `dataGridAccordion` section of the language pack
 * (`3 results`, a plural message with a locale-formatted count). Override it app-wide
 * through `withDataGridAccordionLabels`: a `count` formatter owns word order and plural
 * rules, the `countSingular` / `countPlural` nouns alone compose through `countWithNoun`.
 * Binding `cngxDgaCountSingular` / `cngxDgaCountPlural` per instance always composes
 * through `countWithNoun`.
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
  private readonly overrides = coerceSignal(inject(CNGX_DATA_GRID_ACCORDION_CONFIG).labels);

  /**
   * Singular noun for a count of 1. Unbound, the `countSingular` label applies;
   * binding either noun switches to `<count> <noun>` composition.
   */
  readonly singular = input<string | undefined>(undefined, { alias: 'cngxDgaCountSingular' });
  /**
   * Plural noun for any other count. Unbound, the `countPlural` label applies;
   * binding either noun switches to `<count> <noun>` composition.
   */
  readonly plural = input<string | undefined>(undefined, { alias: 'cngxDgaCountPlural' });

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
        const labels = this.labels();
        if (singular === undefined && plural === undefined && !this.nounsOnlyOverride()) {
          return labels.count(count);
        }
        const noun =
          count === 1 ? (singular ?? labels.countSingular) : (plural ?? labels.countPlural);
        return labels.countWithNoun(count, noun);
      });
      this.renderer.setProperty(this.element, 'textContent', text);
    });
  }

  /**
   * `true` when the config overrides a noun but not the `count` formatter: the
   * nouns then compose, so a nouns-only override still reaches assistive tech.
   */
  private nounsOnlyOverride(): boolean {
    const overrides = this.overrides() ?? {};
    const nouns = overrides.countSingular !== undefined || overrides.countPlural !== undefined;
    return nouns && overrides.count === undefined;
  }
}
