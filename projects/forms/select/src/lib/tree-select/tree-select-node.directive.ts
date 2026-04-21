import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectNodeContext } from './tree-select.model';

/**
 * Override template for a single `CngxTreeSelect` row. Replaces the
 * built-in twisty/indicator/label layout while keeping the surrounding
 * `role="treeitem"` wrapper and ARIA wiring (`aria-level`,
 * `aria-posinset`, `aria-setsize`, `aria-expanded`, `aria-selected`,
 * `aria-disabled`) that live on the panel.
 *
 * Context shape: {@link CngxTreeSelectNodeContext}. The panel binds
 * every derived flag the consumer might need (expanded, selected,
 * indeterminate, hasChildren, depth, disabled) plus two closed
 * callbacks — `toggleExpand` and `handleSelect` — that route through
 * the surrounding component so custom markup participates in the
 * commit-action, cascade, and announce flows without re-plumbing.
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
 * Like the flat-select family's `*cngxSelectCheck` / `*cngxSelectEmpty`
 * / etc. directives, this is a zero-logic holder — just a typed wrapper
 * around `TemplateRef` that the surrounding component discovers via
 * `contentChild`.
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectNode]',
  standalone: true,
  exportAs: 'cngxTreeSelectNode',
})
export class CngxTreeSelectNode<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectNodeContext<T>>>(TemplateRef);
}
