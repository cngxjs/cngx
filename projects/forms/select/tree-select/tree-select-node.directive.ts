import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectNodeContext } from './tree-select.model';

/**
 * Override template for a single `CngxTreeSelect` row. Replaces the
 * ENTIRE built-in row - the projected markup owns the whole treeitem,
 * not just its inner layout. Carry `role="treeitem"`, `[attr.id]`
 * (active-descendant highlight targets it), the level / posinset /
 * setsize attributes, and mirror `aria-checked` from the context's
 * `selected` / `indeterminate` flags: `'mixed'` when indeterminate,
 * else the boolean - the APG checkbox-tree pattern the default row
 * follows. The panel only supplies the `role="tree"` container.
 *
 * Context: {@link CngxTreeSelectNodeContext}. Carries every reactive
 * flag (expanded, selected, indeterminate, hasChildren, depth,
 * disabled) plus closed `toggleExpand` / `handleSelect` callbacks so
 * custom markup participates in commit / cascade / announce.
 *
 * ```html
 * <cngx-tree-select [nodes]="tree" [(values)]="selected">
 *   <ng-template
 *     cngxTreeSelectNode
 *     let-node
 *     let-selected="selected"
 *     let-indeterminate="indeterminate"
 *     let-expanded="expanded"
 *     let-hasChildren="hasChildren"
 *     let-depth="depth"
 *     let-toggleExpand="toggleExpand"
 *     let-handleSelect="handleSelect"
 *   >
 *     <div
 *       role="treeitem"
 *       [attr.id]="node.id"
 *       [attr.aria-level]="depth + 1"
 *       [attr.aria-posinset]="node.posinset"
 *       [attr.aria-setsize]="node.setsize"
 *       [attr.aria-expanded]="hasChildren ? expanded : null"
 *       [attr.aria-checked]="indeterminate ? 'mixed' : selected"
 *     >
 *       @if (hasChildren) {
 *         <button type="button" tabindex="-1" (click)="toggleExpand()">
 *           {{ expanded ? '▾' : '▸' }}
 *         </button>
 *       }
 *       <cngx-checkbox-indicator
 *         [checked]="selected"
 *         [indeterminate]="indeterminate"
 *         (click)="handleSelect()"
 *       />
 *       <span>{{ node.label }}</span>
 *     </div>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * Zero-logic holder - typed wrapper around `TemplateRef`, discovered
 * via `contentChild`.
 *
 * @category forms/select/tree-select
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/tree-select/tree-select-node.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreeSelect, CngxTreeSelectChip, CngxTreeSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectNode]',
  standalone: true,
  exportAs: 'cngxTreeSelectNode',
})
export class CngxTreeSelectNode<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectNodeContext<T>>>(TemplateRef);
}
