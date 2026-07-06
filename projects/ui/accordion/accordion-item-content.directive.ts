import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot marking a {@link CngxAccordionItem}'s region body as lazy.
 * The item renders it via `ngTemplateOutlet` only after the region has first
 * opened (a `hasOpened` `linkedSignal`), then keeps it alive. Without this
 * directive the item projects its body eagerly through the default slot; with
 * it, the body is absent from the DOM until first expansion.
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemTitle>Report</span>
 *   <ng-template cngxAccordionItemContent>
 *     <expensive-report />
 *   </ng-template>
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemTitle
 */
@Directive({
  selector: 'ng-template[cngxAccordionItemContent]',
  exportAs: 'cngxAccordionItemContent',
  standalone: true,
})
export class CngxAccordionItemContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
