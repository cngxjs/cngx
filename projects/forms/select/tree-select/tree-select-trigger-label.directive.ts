import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectTriggerLabelContext } from './tree-select.model';

/**
 * Override the entire chip strip with a custom summary. Mutually
 * exclusive with `*cngxTreeSelectChip` — project one or the other.
 * Context carries resolved selected items, raw values, and count.
 *
 * Mirrors `CngxMultiSelectTriggerLabel` so the same snippet works
 * across variants.
 *
 * @example
 * ```html
 * <cngx-tree-select [nodes]="tree" [(values)]="picked">
 *   <ng-template cngxTreeSelectTriggerLabel let-selected let-count="count">
 *     @if (count === 0) { <!-- placeholder takes over --> }
 *     @else if (count === 1) { {{ selected[0].label }} }
 *     @else { {{ count }} selected }
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectTriggerLabel]',
  standalone: true,
  exportAs: 'cngxTreeSelectTriggerLabel',
})
export class CngxTreeSelectTriggerLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectTriggerLabelContext<T>>>(TemplateRef);
}
