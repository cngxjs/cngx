import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Template context for {@link CngxAccordionItemIcon}: `$implicit` is the item's
 * current expanded state, so the override can render an open/closed glyph.
 *
 * @category ui/accordion
 */
export interface CngxAccordionItemIconContext {
  readonly $implicit: boolean;
}

/**
 * Structural slot overriding a {@link CngxAccordionItem}'s chevron. The item
 * renders it in the header's icon position with the expanded state as
 * `$implicit`; absent, the item falls back to its CSS chevron default (no hard
 * `CngxIcon` dependency).
 *
 * ```html
 * <cngx-accordion-item>
 *   <span cngxAccordionItemTitle>Filters</span>
 *   <ng-template cngxAccordionItemIcon let-expanded>
 *     <my-icon [name]="expanded ? 'minus' : 'plus'" />
 *   </ng-template>
 * </cngx-accordion-item>
 * ```
 *
 * @category ui/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordionItemContent
 */
@Directive({
  selector: 'ng-template[cngxAccordionItemIcon]',
  exportAs: 'cngxAccordionItemIcon',
  standalone: true,
})
export class CngxAccordionItemIcon {
  readonly templateRef = inject(TemplateRef<CngxAccordionItemIconContext>);

  static ngTemplateContextGuard(
    _dir: CngxAccordionItemIcon,
    ctx: unknown,
  ): ctx is CngxAccordionItemIconContext {
    return true;
  }
}
