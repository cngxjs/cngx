import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot for a {@link CngxAccordionItem}'s busy state. The item renders
 * it inside the region while the item's `[state]` is `loading` (a first-load
 * skeleton that replaces the body) or `refreshing` (a subtle overlay with the
 * body kept mounted). Absent, the item falls back to its CSS skeleton default.
 *
 * The region already carries `aria-busy` as a `computed()`, so the busy visual
 * is decorative (`aria-hidden`); assistive tech learns the busy state from
 * `aria-busy`, not from this template.
 *
 * ```html
 * <cngx-accordion-item [state]="report.status()">
 *   <span cngxAccordionItemTitle>Report</span>
 *   <ng-template cngxAccordionItemBusy><my-skeleton /></ng-template>
 *   <ng-template cngxAccordionItemContent>{{ report.data() }}</ng-template>
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-busy.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemError
 */
@Directive({
  selector: 'ng-template[cngxAccordionItemBusy]',
  exportAs: 'cngxAccordionItemBusy',
  standalone: true,
})
export class CngxAccordionItemBusy {
  readonly templateRef = inject(TemplateRef<unknown>);
}
