import { Directive } from '@angular/core';

/**
 * Projected trailing-meta marker for a {@link CngxAccordionItem}. Put it on the
 * facts that trail the title - a timestamp, a status badge, an SLA chip, an
 * amount. The item renders it as a sibling of the header button (not inside it),
 * so interactive meta content (a link, a remove-button) stays valid HTML instead
 * of nesting a control inside a button. Meta is real content, not `aria-hidden`:
 * it is excluded from the button's accessible name only by the name-pin to the
 * title, so screen-reader users still reach it in reading order.
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemTitle>Deployment</span>
 *   <span cngxAccordionItemMeta><cngx-badge>Failed</cngx-badge></span>
 *   Body…
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-meta.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemLeading
 */
@Directive({
  selector: '[cngxAccordionItemMeta]',
  exportAs: 'cngxAccordionItemMeta',
  standalone: true,
})
export class CngxAccordionItemMeta {}
