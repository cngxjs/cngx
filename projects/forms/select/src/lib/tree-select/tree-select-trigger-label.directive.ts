import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectTriggerLabelContext } from './tree-select.model';

/**
 * Override the entire chip strip with a plain-text / custom summary.
 * Mutually exclusive with `*cngxTreeSelectChip` — project one or the
 * other. The context exposes the resolved selected items, raw values,
 * and count, so consumer templates can render `"{{ count }} selected"`
 * variants or rich summaries without touching the component body.
 *
 * Mirrors `CngxMultiSelectTriggerLabel` so the same template snippet
 * works across variants when consumers share a summary widget.
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
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectTriggerLabel]',
  standalone: true,
  exportAs: 'cngxTreeSelectTriggerLabel',
})
export class CngxTreeSelectTriggerLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectTriggerLabelContext<T>>>(TemplateRef);
}
