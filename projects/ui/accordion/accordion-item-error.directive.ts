import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot for a {@link CngxAccordionItem}'s error state. The item renders
 * it inside the region, in a `role="alert"` container, when the item's `[state]`
 * is `error` - so the error body is announced to assistive tech the moment it
 * appears. Absent, the item renders a minimal CSS error affordance; the
 * announced message is this slot's responsibility (author it with the error
 * text, e.g. a retry action).
 *
 * ```html
 * <cngx-accordion-item [state]="report.status()">
 *   <span cngxAccordionItemTitle>Report</span>
 *   <ng-template cngxAccordionItemError>
 *     Could not load. <button type="button" (click)="retry()">Retry</button>
 *   </ng-template>
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-error.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemBusy
 */
@Directive({
  selector: 'ng-template[cngxAccordionItemError]',
  exportAs: 'cngxAccordionItemError',
  standalone: true,
})
export class CngxAccordionItemError {
  readonly templateRef = inject(TemplateRef<unknown>);
}
