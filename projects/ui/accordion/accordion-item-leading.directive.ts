import { Directive } from '@angular/core';

/**
 * Projected-leading marker for a {@link CngxAccordionItem}. Put it on the
 * decorative cell that opens the heading row - an index number, an icon tile, a
 * category tag, a timeline rail-node, a severity spine. The item renders it as a
 * sibling of the header button (not inside it) and wraps it `aria-hidden`, since
 * leading content is presentational: it never names the section and must not
 * leak into the button's accessible name.
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemLeading>01</span>
 *   <span cngxAccordionItemTitle>Overview</span>
 *   Body…
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-leading.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemMeta
 */
@Directive({
  selector: '[cngxAccordionItemLeading]',
  exportAs: 'cngxAccordionItemLeading',
  standalone: true,
})
export class CngxAccordionItemLeading {}
