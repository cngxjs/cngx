import { computed, Directive, input } from '@angular/core';
import { createSortHeaderState } from './sort-header-state';
import { type CngxSort } from './sort.directive';

/**
 * Molecule directive for sort-header elements.
 *
 * Apply to any clickable header element. Consumer provides an explicit
 * `[cngxSortRef]` binding - no ancestor injection, no hidden wiring.
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
 * @category common/data/sort
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/sort/sort-header.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSort, CngxFilter, CngxPaginate
 *
 * <example-url>http://localhost:4200/#/common/data/sort/basic</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/multi-sort</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/controlled</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/aria-and-keyboard</example-url>
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

  private readonly state = createSortHeaderState(this.cngxSortRef, this.field);

  /** `true` when this column is part of the active sort (primary or secondary). */
  readonly isActive = this.state.isActive;
  /** `true` when this column is active and sorted ascending. */
  readonly isAsc = this.state.isAsc;
  /** `true` when this column is active and sorted descending. */
  readonly isDesc = this.state.isDesc;

  /**
   * 1-based position of this column in the sort stack.
   * Returns `0` when the column is not part of the active sort.
   * Only meaningful when `multiSort` is enabled on the owning `CngxSort`.
   */
  readonly priority = this.state.priority;

  /** The `aria-sort` attribute value for the host element. */
  readonly ariaSort = computed((): 'ascending' | 'descending' | null => {
    if (!this.state.isActive()) {
      return null;
    }
    return this.state.isAsc() ? 'ascending' : 'descending';
  });

  protected handleSort(event?: MouseEvent): void {
    this.state.toggle(event?.shiftKey ?? false);
  }
}
