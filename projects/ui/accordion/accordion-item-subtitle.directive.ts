import { Directive } from '@angular/core';

/**
 * Projected-subtitle marker for a {@link CngxAccordionItem}. Put it on the
 * secondary line that sits below the title inside the header button. The item
 * projects it under the title but keeps it OUT of the button's accessible name
 * (the name is pinned to the title via `aria-labelledby`); the subtitle is
 * instead announced through the button's `aria-describedby`, so an informative
 * subtitle is not lost to assistive tech while the name stays title-only.
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemTitle>Billing</span>
 *   <span cngxAccordionItemSubtitle>Invoices and payment methods</span>
 *   Body…
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-subtitle.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemTitle
 */
@Directive({
  selector: '[cngxAccordionItemSubtitle]',
  exportAs: 'cngxAccordionItemSubtitle',
  standalone: true,
})
export class CngxAccordionItemSubtitle {}
