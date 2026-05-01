import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
  model,
} from '@angular/core';
import {
  CngxChipInGroup,
  CngxMultiChipGroup,
} from '@cngx/common/interactive';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxFilter } from '../filter/filter.directive';

/**
 * Bridge that connects a multi-select chip strip to a `CngxFilter`
 * predicate via Pillar-1 derivation — no `effect()` write-back, no
 * manual sync. The bridge composes `<cngx-multi-chip-group>` for
 * the visible chip strip and registers a single closure-style
 * predicate on the parent `[filterRef]`. Chip toggles update
 * `selectedValues`; the registered closure reads `selectedValues()`
 * lazily on every invocation so downstream filtered consumers
 * recompute without the bridge ever re-registering.
 *
 * Filter chips are inherently multi-select per
 * `feedback_select_family_split`; a single-mode filter-chip pattern
 * is intentionally out of scope. Consumers needing a single-select
 * filter wire `<cngx-chip-group>` to a custom predicate themselves.
 *
 * **Sync contract — derivation, not effect.** The bridge calls
 * `filterRef.addPredicate(filterKey, predicateFn)` EXACTLY ONCE
 * during mount (in `afterNextRender`, because `input.required()`
 * cannot be read from the constructor body). `predicateFn` is a
 * closure that reads `this.selectedValues()` and
 * `this.optionValueFn()` on every invocation. Because
 * `CngxFilter.predicate` is itself a `computed()` consumed by
 * downstream filtered lists, each item-evaluation flows through
 * `selectedValues()` in the consumer's reactive context — chip
 * toggles propagate without any `effect()` writing back into the
 * filter.
 *
 * **Empty-selection semantics.** When `selectedValues()` is `[]`,
 * the closure returns `true` for every item — equivalent to "no
 * filter applied". The bridge deliberately does NOT call
 * `removePredicate` on empty selection: leaving the predicate
 * registered with a constant-`true` short-circuit is cheaper than
 * re-registering on every empty/non-empty boundary, and keeps the
 * predicate-stack stable (no `predicatesChange` emission churn).
 *
 * **Teardown.** `DestroyRef.onDestroy` calls `removePredicate` only
 * when registration actually happened (`registered` flag) — guards
 * against the case where the component is destroyed before
 * `afterNextRender` fires. The destroy callback reads `filterRef`
 * and `filterKey` lazily so a consumer that re-binds these between
 * mount and unmount cleans the latest binding (per
 * `reference_signal_architecture` memory-hygiene rule).
 *
 * @example
 * ```html
 * <cngx-filter-chips
 *   label="Tags"
 *   [options]="tagOptions"
 *   optionLabel="label"
 *   optionValue="id"
 *   [filterRef]="employees"
 *   filterKey="tags"
 * />
 *
 * <ng-container cngxFilter #employees="cngxFilter">
 *   @for (emp of filteredEmployees(); track emp.id) {
 *     ...
 *   }
 * </ng-container>
 * ```
 *
 * @category filter
 */
@Component({
  selector: 'cngx-filter-chips',
  exportAs: 'cngxFilterChips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxMultiChipGroup, CngxChipInGroup],
  template: `
    <cngx-multi-chip-group
      [label]="label()"
      [(selectedValues)]="selectedValues"
      [state]="state()"
    >
      @for (option of options(); track optionValue()(option)) {
        <span cngxChipInGroup [value]="optionValue()(option)">
          {{ optionLabel()(option) }}
        </span>
      }
    </cngx-multi-chip-group>
  `,
})
export class CngxFilterChips<TItem = unknown, TValue = unknown> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly TItem[]>();
  readonly optionLabel = input.required<(item: TItem) => string>();
  readonly optionValue = input.required<(item: TItem) => TValue>();
  readonly filterRef = input.required<CngxFilter<TItem>>();
  readonly filterKey = input.required<string>();
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /**
   * Internal multi-select state driven by chip toggles. Exposed as
   * a `model` so consumers may seed initial selection via
   * `[(selectedValues)]` if they need to; usually the consumer leaves
   * this internal and reads results via the parent
   * `CngxFilter.predicate`.
   */
  readonly selectedValues = model<TValue[]>([]);

  private registered = false;

  constructor() {
    const predicateFn = (item: TItem): boolean => {
      const values = this.selectedValues();
      if (values.length === 0) {
        return true;
      }
      const key = this.optionValue()(item);
      return values.some((v) => Object.is(v, key));
    };

    afterNextRender(() => {
      this.filterRef().addPredicate(this.filterKey(), predicateFn);
      this.registered = true;
    });

    inject(DestroyRef).onDestroy(() => {
      if (!this.registered) {
        return;
      }
      this.filterRef().removePredicate(this.filterKey());
    });
  }
}
