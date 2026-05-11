import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectNodeContext } from './tree-select.model';

/**
 * Override template for a single `CngxTreeSelect` row. Replaces the
 * built-in twisty/indicator/label layout while keeping the panel's
 * `role="treeitem"` wrapper and ARIA wiring intact.
 *
 * Context: {@link CngxTreeSelectNodeContext}. Carries every reactive
 * flag (expanded, selected, indeterminate, hasChildren, depth,
 * disabled) plus closed `toggleExpand` / `handleSelect` callbacks so
 * custom markup participates in commit / cascade / announce.
 *
 * @example
 * ```html
 * <cngx-tree-select [nodes]="tree" [(values)]="selected">
 *   <ng-template
 *     cngxTreeSelectNode
 *     let-node
 *     let-selected="selected"
 *     let-indeterminate="indeterminate"
 *     let-expanded="expanded"
 *     let-hasChildren="hasChildren"
 *     let-toggleExpand="toggleExpand"
 *     let-handleSelect="handleSelect"
 *   >
 *     @if (hasChildren) {
 *       <button type="button" tabindex="-1" (click)="toggleExpand()">
 *         {{ expanded ? '▾' : '▸' }}
 *       </button>
 *     }
 *     <cngx-checkbox-indicator
 *       [checked]="selected"
 *       [indeterminate]="indeterminate"
 *       (click)="handleSelect()"
 *     />
 *     <span>{{ node.label }}</span>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * Zero-logic holder — typed wrapper around `TemplateRef`, discovered
 * via `contentChild`.
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectNode]',
  standalone: true,
  exportAs: 'cngxTreeSelectNode',
})
export class CngxTreeSelectNode<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectNodeContext<T>>>(TemplateRef);
}
