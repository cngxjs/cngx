import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import {
  CNGX_FORM_FIELD_CONTROL,
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldControl,
} from '@cngx/core/tokens';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  nextUid,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';

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
 * `[keyFn]` lets consumers with object-typed values map each value
 * to a stable membership key (typically `(v) => v.id`). Without it,
 * membership uses identity / primitive equality — which silently
 * breaks across re-emissions when the consumer refetches array
 * elements with the same id but new references.
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
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-checkbox-group--horizontal]': 'orientation() === "horizontal"',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxCheckboxGroup },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxCheckboxGroup },
  ],
  template: `<ng-content />`,
  styleUrl: './checkbox-group.component.css',
})
export class CngxCheckboxGroup<T = unknown>
  implements CngxControlValue<T[]>, CngxFormFieldControl
{
  readonly selectedValues = model<T[]>([]);
  readonly value = this.selectedValues;
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  /**
   * Bridge-writable invalid state. `model<boolean>` mirrors `disabled`
   * so external integrations (RF/Signal-Forms bridges, custom validity
   * adapters) can drive it without a parallel API path — consumers
   * typically read only.
   */
  readonly invalid = model<boolean>(false);
  /**
   * Optional id of an external error message element. When set, the
   * host emits `aria-errormessage="<id>"`; consumers MUST render an
   * element with that id. Default `null` skips the attribute.
   */
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly label = input<string | undefined>(undefined);
  readonly allValues = input<readonly T[] | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  private readonly controller: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.selectedValues, {
    keyFn: (v) => this.keyFn()(v),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller.destroy());
  }

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

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-checkbox-group-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when no values selected. */
  readonly empty = computed(() => this.selectedValues().length === 0);

  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly aggregator = inject(CNGX_ERROR_AGGREGATOR, {
    optional: true,
    skipSelf: true,
  });

  readonly errorState = computed<boolean>(
    () =>
      this.fieldHost?.showError() ?? this.aggregator?.shouldShow() ?? false,
  );

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
  }
}
