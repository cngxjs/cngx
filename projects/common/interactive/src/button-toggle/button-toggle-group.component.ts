import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { nextUid, type CngxAsyncState } from '@cngx/core/utils';

import {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from '../control-value/control-value.token';
import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';
import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

/**
 * Single-select button-toggle group. Owns a `value = model<T |
 * undefined>` (the canonical single-value source) and exposes the
 * parent contract via `CNGX_BUTTON_TOGGLE_GROUP`. Behaves as a W3C
 * APG `radiogroup` — arrow keys move focus AND select (auto-select
 * variant); Tab + programmatic focus do not select on focus alone;
 * Space and Enter select the currently-focused toggle.
 *
 * Mode is **static**: this component is the single-select half of a
 * deliberate split (per `feedback_select_family_split`). Consumers
 * pick `<cngx-button-toggle-group>` for radiogroup semantics or
 * `<cngx-button-multi-toggle-group>` for toolbar semantics — never a
 * runtime `[selectionMode]` flag, never a shape-shifter. The leaf
 * `CngxButtonToggle` injects EITHER this token OR
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` (`{ optional: true }` on both)
 * and chooses its ARIA pattern at injection time, not at runtime.
 *
 * Auto-select wiring follows the same Pillar-§6 contract as
 * `CngxRadioGroup`: a transient `pendingArrowSelect` plain-field flag
 * is raised on host `(keydown)` for any roving-relevant key
 * (Arrow*, Home, End); each focused leaf consumes the flag in its
 * `(focus)` handler via `consumePendingArrowSelect()`. The signal
 * write happens inside a DOM event handler — never inside an
 * `effect()`.
 *
 * @example
 * ```html
 * <cngx-button-toggle-group label="Layout" [(value)]="view">
 *   <button cngxButtonToggle value="grid">Grid</button>
 *   <button cngxButtonToggle value="list">List</button>
 *   <button cngxButtonToggle value="table">Table</button>
 * </cngx-button-toggle-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-button-toggle-group, [cngxButtonToggleGroup]',
  exportAs: 'cngxButtonToggleGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-button-toggle-group',
    role: 'radiogroup',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': 'errorMessageId()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-button-toggle-group--horizontal]':
      'orientation() === "horizontal"',
    '(keydown)': 'handleKeydown($event)',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_BUTTON_TOGGLE_GROUP, useExisting: CngxButtonToggleGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxButtonToggleGroup },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxButtonToggleGroup },
  ],
  template: `<ng-content />`,
  styleUrl: './button-toggle-group.component.css',
})
export class CngxButtonToggleGroup<T = unknown>
  implements
    CngxButtonToggleGroupContract<T>,
    CngxControlValue<T | undefined>,
    CngxFormFieldControl
{
  readonly value = model<T | undefined>(undefined);
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
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

  private pendingArrowSelect = false;

  consumePendingArrowSelect(value: T): boolean {
    if (!this.pendingArrowSelect) {
      return false;
    }
    this.pendingArrowSelect = false;
    if (this.disabled()) {
      return false;
    }
    this.value.set(value);
    return true;
  }

  protected handleKeydown(event: Event): void {
    const key = (event as KeyboardEvent).key;
    this.pendingArrowSelect =
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Home' ||
      key === 'End';
  }

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-button-toggle-group-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when no toggle is selected. */
  readonly empty = computed(() => this.value() === undefined);

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
