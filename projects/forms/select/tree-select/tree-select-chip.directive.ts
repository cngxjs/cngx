import { Directive, TemplateRef, inject } from '@angular/core';
import { type CngxTreeSelectChipContext } from './tree-select.model';

/**
 * Per-chip override for `CngxTreeSelect`'s trigger. Replaces the
 * default `<cngx-chip>` pill while keeping the commit-aware `remove`
 * callback wired to the single-deselect flow.
 *
 * Zero-logic slot holder discovered via `contentChild` and rendered
 * through `*ngTemplateOutlet`.
 *
 * @example
 * ```html
 * <cngx-tree-select [nodes]="tree" [(values)]="picked">
 *   <ng-template cngxTreeSelectChip let-opt let-remove="remove">
 *     <span class="chip chip--primary">
 *       {{ opt.label }}
 *       <button type="button" (click)="remove()" aria-label="Remove">✕</button>
 *     </span>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTreeSelectChip]',
  standalone: true,
  exportAs: 'cngxTreeSelectChip',
})
export class CngxTreeSelectChip<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTreeSelectChipContext<T>>>(TemplateRef);
}
