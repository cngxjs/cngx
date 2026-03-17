import { computed, Directive, input } from '@angular/core';
import { type CngxSort } from './sort.directive';

/**
 * Molecule directive for sort-header elements.
 *
 * Apply to any clickable header element. Consumer provides an explicit
 * `[cngxSortRef]` binding — no ancestor injection, no hidden wiring.
 *
 * ```html
 * <div cngxSort #sort="cngxSort">
 *   <button cngxSortHeader="name" [cngxSortRef]="sort" #nameHeader="cngxSortHeader">
 *     Name @if (nameHeader.isActive()) { <span>{{ nameHeader.isAsc() ? '↑' : '↓' }}</span> }
 *   </button>
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxSortHeader]',
  exportAs: 'cngxSortHeader',
  standalone: true,
  host: {
    '(click)': 'onSort()',
    '[attr.aria-sort]': 'ariaSort()',
    '[class.cngx-sort-header--active]': 'isActive()',
    '[class.cngx-sort-header--asc]': 'isAsc()',
    '[class.cngx-sort-header--desc]': 'isDesc()',
  },
})
export class CngxSortHeader {
  /** The field key this header cell represents. */
  readonly field = input.required<string>({ alias: 'cngxSortHeader' });
  /** Explicit reference to the owning `CngxSort`. */
  readonly cngxSortRef = input.required<CngxSort>();

  /** `true` when this column is the active sort column. */
  readonly isActive = computed(() => this.cngxSortRef().active() === this.field());
  /** `true` when this column is active and sorted ascending. */
  readonly isAsc = computed(() => this.isActive() && this.cngxSortRef().direction() === 'asc');
  /** `true` when this column is active and sorted descending. */
  readonly isDesc = computed(() => this.isActive() && this.cngxSortRef().direction() === 'desc');

  /** The `aria-sort` attribute value for the host element. */
  readonly ariaSort = computed((): 'ascending' | 'descending' | null => {
    if (!this.isActive()) return null;
    return this.isAsc() ? 'ascending' : 'descending';
  });

  protected onSort(): void {
    this.cngxSortRef().setSort(this.field());
  }
}
