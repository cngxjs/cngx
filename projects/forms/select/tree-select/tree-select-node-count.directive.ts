import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectNodeCountContext } from './tree-select.model';

/**
 * `*cngxTreeSelectNodeCount` slot - replaces the selected-of-total count
 * at the inline end of each parent row in the default row markup
 * (`*cngxTreeSelectNode` replaces the whole row and gets `selectedCount` /
 * `descendantCount` instead). Leaves render no count.
 *
 * The built-in count shows only once at least one descendant is selected.
 * A projected template is rendered for every parent, zero included, and
 * gets `selected` / `total`, so the template decides whether to show `0/N`.
 *
 * The host keeps the count inside an `aria-hidden` wrapper: the row's
 * `aria-checked` already tells AT what the count summarizes. A global
 * default goes in `CNGX_SELECT_CONFIG.templates.treeNodeCount`.
 *
 * ```html
 * <cngx-tree-select ...>
 *   <ng-template cngxTreeSelectNodeCount let-selected="selected" let-total="total">
 *     <span class="my-count">{{ selected }} of {{ total }}</span>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * @category forms/select/templates
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/tree-select/tree-select-node-count.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreeSelect, CngxTreeSelectNode
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectNodeCount]',
  standalone: true,
  exportAs: 'cngxTreeSelectNodeCount',
})
export class CngxTreeSelectNodeCount<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectNodeCountContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxTreeSelectNodeCount<T>,
    ctx: unknown,
  ): ctx is CngxTreeSelectNodeCountContext<T> {
    return true;
  }
}
