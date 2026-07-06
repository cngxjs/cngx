import { Directive } from '@angular/core';

/**
 * Projected-title marker for a {@link CngxAccordionItem}. Put it on the element
 * that names the section; the item projects it into the header button via
 * `<ng-content select="[cngxAccordionItemTitle]">`, so the title becomes the
 * header's accessible name.
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemTitle>Billing</span>
 *   Body…
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-title.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem
 */
@Directive({
  selector: '[cngxAccordionItemTitle]',
  exportAs: 'cngxAccordionItemTitle',
  standalone: true,
})
export class CngxAccordionItemTitle {}
