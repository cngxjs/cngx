import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import {
  createSelectionController,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';

/**
 * Multi-value checkbox-group molecule. Owns a `selectedValues` model
 * (the canonical multi-value source) and exposes membership
 * derivations (`allSelected`, `someSelected`, `noneSelected`,
 * `selectedCount`) plus the toggle-all triad (`toggleAll`, `select`,
 * `deselect`) every consumer needs to wire a "select all" master
 * checkbox to the group.
 *
 * Internals lean on `createSelectionController` from `@cngx/core/utils`
 * for membership tracking — the controller's structural-equality
 * `selected` snapshot prevents downstream computed cascades from
 * thrashing when a re-emission produces the same logical contents
 * with a different array reference.
 *
 * `value` is a structural alias of `selectedValues` so the group
 * satisfies `CngxControlValue<T[]>` without owning two synchronised
 * models — both names point to the same `ModelSignal<T[]>` instance.
 *
 * Per Pillar 1 (Ableitung statt Verwaltung), every derived flag is a
 * `computed()` — there is no manual sync between membership and the
 * exposed flags. Per Pillar 3 (Komposition statt Konfiguration), the
 * group composes `CngxRovingTabindex` as a host directive and emits
 * no implicit children — consumers project `<cngx-checkbox>` instances
 * (or any other CNGX_CONTROL_VALUE-bearing atom) and bind each leaf's
 * value-tracking themselves.
 *
 * `[allValues]` is optional; when supplied, `allSelected` reflects
 * "every option ticked" rather than the vacuous "every selected value
 * is still selected" default. Consumers that wire a master checkbox
 * pass the full option pool here so `toggleAll()` can
 * select-or-clear-all per the user's mental model.
 *
 * `[state]` is an optional `CngxAsyncState<unknown>` input; when bound,
 * `aria-busy` reflects `state.status() === 'loading'` reactively so AT
 * announces the busy moment without the consumer wiring the attribute
 * by hand.
 *
 * @example
 * ```html
 * <cngx-checkbox-group
 *   label="Notifications"
 *   [allValues]="options"
 *   [(selectedValues)]="picked"
 * >
 *   <cngx-checkbox
 *     *ngFor="let opt of options"
 *     [value]="opt"
 *   >{{ opt }}</cngx-checkbox>
 * </cngx-checkbox-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-checkbox-group, [cngxCheckboxGroup]',
  exportAs: 'cngxCheckboxGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-checkbox-group',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-checkbox-group--horizontal]': 'orientation() === "horizontal"',
  },
  providers: [{ provide: CNGX_CONTROL_VALUE, useExisting: CngxCheckboxGroup }],
  template: `<ng-content />`,
  styleUrl: './checkbox-group.component.css',
})
export class CngxCheckboxGroup<T = unknown> implements CngxControlValue<T[]> {
  readonly selectedValues = model<T[]>([]);
  readonly value = this.selectedValues;
  readonly disabled = model<boolean>(false);
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly label = input.required<string>();
  readonly allValues = input<readonly T[] | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  private readonly controller: SelectionController<T> =
    createSelectionController<T>(this.selectedValues, { keyFn: (v) => v });

  readonly selectedCount = this.controller.selectedCount;

  readonly noneSelected = computed(() => this.selectedCount() === 0);

  readonly allSelected = computed(() => {
    const pool = this.allValues();
    if (pool === undefined) {
      return this.selectedCount() > 0;
    }
    if (pool.length === 0) {
      return false;
    }
    for (const v of pool) {
      if (!this.controller.isSelected(v)()) {
        return false;
      }
    }
    return true;
  });

  readonly someSelected = computed(
    () => this.selectedCount() > 0 && !this.allSelected(),
  );

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

  toggleAll(): void {
    if (this.disabled()) {
      return;
    }
    const pool = this.allValues();
    if (pool !== undefined) {
      this.controller.toggleAll(pool);
      return;
    }
    if (this.selectedCount() > 0) {
      this.controller.clear();
    }
  }

  select(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.select(value);
  }

  deselect(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.deselect(value);
  }
}
