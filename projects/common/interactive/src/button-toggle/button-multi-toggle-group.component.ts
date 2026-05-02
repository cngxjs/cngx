import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  signal,
  type Signal,
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
import {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-multi-toggle-group.token';

/**
 * Multi-select button-toggle group. Owns a `selectedValues =
 * model<T[]>([])` (the canonical multi-value source) and exposes the
 * parent contract via `CNGX_BUTTON_MULTI_TOGGLE_GROUP`. Behaves as a
 * W3C APG `toolbar` — arrow keys MOVE focus only (no auto-select);
 * Space and Enter on a focused leaf toggle that leaf's membership.
 *
 * Mode is **static**: this is the multi-select half of the
 * deliberate single/multi split (per
 * `feedback_select_family_split`). Consumers pick this component or
 * `<cngx-button-toggle-group>` at template authoring time. Leaves
 * (`CngxButtonToggle`) inject EITHER token with `{ optional: true }`
 * and choose `aria-checked` (single) vs `aria-selected` (multi)
 * AT INJECTION TIME, never at runtime.
 *
 * Internals lean on `createSelectionController` from
 * `@cngx/core/utils` for membership tracking — the controller's
 * stable per-value `isSelected` signals (memoised by key) let leaves
 * read membership inside their own `computed()` without triggering a
 * fresh array walk on every change-detection pass.
 *
 * `value` is a structural alias of `selectedValues` so the group
 * satisfies `CngxControlValue<T[]>` without owning two synchronised
 * models — both names point to the same `ModelSignal<T[]>` instance.
 *
 * @example
 * ```html
 * <cngx-button-multi-toggle-group label="Filters" [(selectedValues)]="filters">
 *   <button cngxButtonToggle value="open">Open</button>
 *   <button cngxButtonToggle value="closed">Closed</button>
 *   <button cngxButtonToggle value="archived">Archived</button>
 * </cngx-button-multi-toggle-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-button-multi-toggle-group, [cngxButtonMultiToggleGroup]',
  exportAs: 'cngxButtonMultiToggleGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-button-multi-toggle-group',
    role: 'toolbar',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-button-multi-toggle-group--horizontal]':
      'orientation() === "horizontal"',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    {
      provide: CNGX_BUTTON_MULTI_TOGGLE_GROUP,
      useExisting: CngxButtonMultiToggleGroup,
    },
    {
      provide: CNGX_CONTROL_VALUE,
      useExisting: CngxButtonMultiToggleGroup,
    },
    {
      provide: CNGX_FORM_FIELD_CONTROL,
      useExisting: CngxButtonMultiToggleGroup,
    },
  ],
  template: `<ng-content />`,
  styleUrl: './button-toggle-group.component.css',
})
export class CngxButtonMultiToggleGroup<T = unknown>
  implements
    CngxButtonMultiToggleGroupContract<T>,
    CngxControlValue<T[]>,
    CngxFormFieldControl
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
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly keyFn = input<(value: T) => unknown>((v) => v);

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

  private readonly controller: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.selectedValues, {
    keyFn: (v) => this.keyFn()(v),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller.destroy());
  }

  isSelected(value: T): Signal<boolean> {
    return this.controller.isSelected(value);
  }

  toggle(value: T): void {
    if (this.disabled()) {
      return;
    }
    this.controller.toggle(value);
  }

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-button-multi-toggle-group-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when no toggles are selected. */
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
