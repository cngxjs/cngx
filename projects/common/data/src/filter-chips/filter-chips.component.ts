import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  afterNextRender,
  contentChild,
  inject,
  input,
  model,
  type Signal,
} from '@angular/core';
import { CngxChip } from '@cngx/common/display';
import {
  CngxChipInGroup,
  CngxMultiChipGroup,
} from '@cngx/common/interactive';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxFilter } from '../filter/filter.directive';

/**
 * Per-chip override slot context. Consumers project an
 * `<ng-template cngxFilterChip let-option let-value="value" let-label="label">`
 * to customize chip body decoration — icons, count badges, colour
 * swatches, anything beyond the default text label.
 *
 * **Decoration-only semantics.** The bridge ALWAYS wraps each option
 * in `<cngx-chip cngxChipInGroup [value]>` itself; the slot only
 * customizes what renders INSIDE that wrapper. Consumers do NOT
 * redeclare selection wiring — it is handled by the bridge so the
 * projected content survives Angular's `*ngTemplateOutlet`
 * lexical-injector semantics (the projected template injects against
 * the consumer's component, NOT the bridge's inner
 * `<cngx-multi-chip-group>`, so a consumer-supplied
 * `cngxChipInGroup` would fail to resolve `CNGX_CHIP_GROUP_HOST`).
 *
 * @category filter
 */
export interface CngxFilterChipContext<TItem = unknown, TValue = unknown> {
  readonly $implicit: TItem;
  readonly option: TItem;
  readonly value: TValue;
  readonly label: string;
}

/**
 * Template-slot directive overriding the default chip body inside
 * `<cngx-filter-chips>`. Consumers attach
 * `<ng-template cngxFilterChip>` to project decoration; the bridge
 * wraps that decoration in `cngxChipInGroup`-bound chip wrappers
 * automatically. Absence falls back to the default text-only label.
 *
 * @category filter
 */
@Directive({
  selector: 'ng-template[cngxFilterChip]',
  standalone: true,
})
export class CngxFilterChip<TItem = unknown, TValue = unknown> {
  readonly template: TemplateRef<CngxFilterChipContext<TItem, TValue>> =
    inject<TemplateRef<CngxFilterChipContext<TItem, TValue>>>(TemplateRef);

  static ngTemplateContextGuard<TItem, TValue>(
    _dir: CngxFilterChip<TItem, TValue>,
    _ctx: unknown,
  ): _ctx is CngxFilterChipContext<TItem, TValue> {
    return true;
  }
}

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
  imports: [CngxChip, CngxMultiChipGroup, CngxChipInGroup, NgTemplateOutlet],
  template: `
    <cngx-multi-chip-group
      [label]="label()"
      [(selectedValues)]="selectedValues"
      [state]="state()"
      [keyFn]="keyFn()"
      [(disabled)]="disabled"
      [(required)]="required"
      [(invalid)]="invalid"
      [errorMessageId]="errorMessageId()"
      [orientation]="orientation()"
    >
      @for (option of options(); track keyFn()(optionValue()(option))) {
        <cngx-chip cngxChipInGroup [value]="optionValue()(option)">
          @if (chipTemplate()?.template; as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl; context: chipContext(option)"
            />
          } @else {
            {{ optionLabel()(option) }}
          }
        </cngx-chip>
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
   * Form-state surface forwarded transparently to the inner
   * `<cngx-multi-chip-group>`. Each is a `model<boolean>` matching the
   * inner shape so consumers can two-way bind with their own forms
   * state without reaching past the bridge. Mirrors `CngxCheckboxGroup`
   * / `CngxButtonToggleGroup` precedent.
   */
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /**
   * Membership key extractor for object-valued chip values. When
   * `TValue` is an object (e.g. `{ id, label }` rather than a
   * primitive id), this fn extracts a stable identity key so chip
   * membership survives re-emissions with fresh references. Forwarded
   * to the inner `<cngx-multi-chip-group>` AND used inside the
   * predicate's `Object.is` comparison. Defaults to identity — works
   * for primitive values.
   */
  readonly keyFn = input<(value: TValue) => unknown>((v) => v);

  /**
   * Resolved consumer-supplied chip template. The query uses an
   * instantiation expression (`CngxFilterChip<TItem, TValue>`) so the
   * bridge's class generics propagate into the slot directive type;
   * absent that propagation, `contentChild(CngxFilterChip)` returns
   * `Signal<CngxFilterChip<unknown, unknown> | undefined>` and the
   * `chipContext()` helper would have to widen on every call.
   */
  protected readonly chipTemplate: Signal<
    CngxFilterChip<TItem, TValue> | undefined
  > = contentChild(CngxFilterChip<TItem, TValue>);

  /**
   * Build the slot context for a given chip option. `optionValue` is
   * invoked here per option for the chip rendering pass; the predicate
   * closure invokes it again per LIST item for membership filtering.
   * Both invocations are necessary because option items (the chip
   * pool) and filtered list items (the consumer's filtered data) are
   * separate data paths — they happen to share a shape under the
   * Phase-5 single-shape limitation, but the bridge cannot memoise
   * across the two paths without conflating them. Consumers should
   * keep `optionValue` cheap (typically a property lookup); a future
   * `[itemValue]` input will separate the two extractors.
   */
  protected readonly chipContext = (
    option: TItem,
  ): CngxFilterChipContext<TItem, TValue> => {
    const value = this.optionValue()(option);
    return {
      $implicit: option,
      option,
      value,
      label: this.optionLabel()(option),
    };
  };

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
      const extract = this.keyFn();
      const key = extract(this.optionValue()(item));
      return values.some((v) => Object.is(extract(v), key));
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
