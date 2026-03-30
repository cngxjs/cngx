import { computed, Directive, input } from '@angular/core';
import { type CngxSort } from './sort.directive';

/**
 * Molecule directive for sort-header elements.
 *
 * Apply to any clickable header element. Consumer provides an explicit
 * `[cngxSortRef]` binding — no ancestor injection, no hidden wiring.
 *
 * In multi-sort mode, Shift+click adds this column to the sort stack.
 * The `priority()` signal returns the 1-based position in the stack
 * (0 when not active), useful for showing sort-order badges.
 *
 * ```html
 * <div cngxSort [multiSort]="true" #sort="cngxSort">
 *   <button cngxSortHeader="name" [cngxSortRef]="sort" #h="cngxSortHeader">
 *     Name
 *     @if (h.isActive()) {
 *       {{ h.isAsc() ? '↑' : '↓' }}
 *       @if (sort.multiSort()) { <span>{{ h.priority() }}</span> }
 *     }
 *   </button>
 * </div>
 * ```
 *
 * @category sort
 */
@Directive({
  selector: '[cngxSortHeader]',
  exportAs: 'cngxSortHeader',
  standalone: true,
  host: {
    '(click)': 'handleSort($event)',
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

  private readonly entry = computed(() =>
    this.cngxSortRef()
      .sorts()
      .find((s) => s.active === this.field()),
  );

  /** `true` when this column is part of the active sort (primary or secondary). */
  readonly isActive = computed(() => this.entry() !== undefined);
  /** `true` when this column is active and sorted ascending. */
  readonly isAsc = computed(() => this.entry()?.direction === 'asc');
  /** `true` when this column is active and sorted descending. */
  readonly isDesc = computed(() => this.entry()?.direction === 'desc');

  /**
   * 1-based position of this column in the sort stack.
   * Returns `0` when the column is not part of the active sort.
   * Only meaningful when `multiSort` is enabled on the owning `CngxSort`.
   */
  readonly priority = computed(() => {
    const idx = this.cngxSortRef()
      .sorts()
      .findIndex((s) => s.active === this.field());
    return idx === -1 ? 0 : idx + 1;
  });

  /** The `aria-sort` attribute value for the host element. */
  readonly ariaSort = computed((): 'ascending' | 'descending' | null => {
    if (!this.isActive()) {
      return null;
    }
    return this.isAsc() ? 'ascending' : 'descending';
  });

  protected handleSort(event?: MouseEvent): void {
    const additive = this.cngxSortRef().multiSort() && (event?.shiftKey ?? false);
    this.cngxSortRef().setSort(this.field(), additive);
  }
}
