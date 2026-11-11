import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectFooterContext } from './tree-select.model';

/**
 * `*cngxTreeSelectFooter` slot - replaces the footer below the tree in the
 * panel (the selected count and the clear-all action; the bottom bar in the
 * mobile sheet). The template gets `count`, `countText`, `clear`,
 * `clearLabel` and `empty`; `clear()` runs the commit-aware clear path, so the
 * clear announcement, `cleared` and `selectionChange` stay on the host. A
 * template that renders its own clear control owns its disabled state: the
 * built-in footer marks it `aria-disabled` and describes it by the count
 * while nothing is selected.
 *
 * A global default goes in `CNGX_SELECT_CONFIG.templates.treeFooter`.
 *
 * ```html
 * <cngx-tree-select ...>
 *   <ng-template cngxTreeSelectFooter let-countText="countText" let-clear="clear" let-empty="empty">
 *     <span>{{ countText }}</span>
 *     <button type="button" [attr.aria-disabled]="empty || null" (click)="clear()">Clear</button>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/tree-select/tree-select-footer.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreeSelect, CngxSelectClearButton
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectFooter]',
  standalone: true,
  exportAs: 'cngxTreeSelectFooter',
})
export class CngxTreeSelectFooter {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectFooterContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxTreeSelectFooter,
    ctx: unknown,
  ): ctx is CngxTreeSelectFooterContext {
    return true;
  }
}
