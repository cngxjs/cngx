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
  CNGX_RADIO_GROUP,
  type CngxRadioGroupContract,
  type CngxRadioRegistration,
} from './radio-group.token';

/**
 * Radio-group molecule that owns the canonical `value` for a set of
 * `CngxRadio` leaves and provides the parent contract via
 * `CNGX_RADIO_GROUP`. The group composes `CngxRovingTabindex` as a
 * host directive (with `inputs: ['orientation']` exposed) so arrow-
 * key navigation across radios is wired from day one. Leaf
 * registration is imperative — `register()` / `unregister()` keep a
 * Map in declaration order so the group can resolve the active
 * radio by id without re-querying content children on every change
 * detection cycle.
 *
 * Per W3C ARIA radio-group authoring practice, `Tab` enters the
 * group; arrow keys move focus AND select (auto-select variant);
 * Space/Enter also select the currently-focused radio. The group's
 * `value` is the source of truth; each leaf computes
 * `radioChecked = computed(() => group.value() === radio.value())`
 * against its own `value` input.
 *
 * **Auto-select wiring (no signal-write-in-effect).** Per the
 * pillar §6 hard rule, the group does NOT subscribe to
 * `CngxRovingTabindex.activeIndex` via an effect that writes
 * `value`. Instead, the group listens to its own host `keydown` and
 * raises a transient `pendingArrowSelect` flag when an arrow / Home
 * / End is pressed. The roving directive moves focus on the same
 * keydown; the newly-focused leaf's `(focus)` handler calls
 * `group.consumePendingArrowSelect(this.value())`. The flag-set
 * (plain field write) and value-set (signal write inside a DOM
 * event handler, not an effect) are both legal under the pillar
 * rules. Tab-into-group fires focus without a preceding arrow
 * keydown, so the flag stays false and no auto-select happens —
 * Tab leaves the consumer's `value` untouched.
 *
 * @example
 * ```html
 * <cngx-radio-group [(value)]="payment" name="payment-method">
 *   <cngx-radio value="card">Card</cngx-radio>
 *   <cngx-radio value="cash">Cash</cngx-radio>
 *   <cngx-radio value="invoice" disabled>Invoice</cngx-radio>
 * </cngx-radio-group>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-radio-group, [cngxRadioGroup]',
  exportAs: 'cngxRadioGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
  ],
  host: {
    class: 'cngx-radio-group',
    role: 'radiogroup',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': '(invalid() || errorState()) ? "true" : null',
    '[attr.aria-errormessage]': '(invalid() || errorState()) ? errorMessageId() || null : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'ariaBusy() ? "true" : null',
    '[class.cngx-radio-group--horizontal]': 'orientation() === "horizontal"',
    '(keydown)': 'handleKeydown($event)',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  providers: [
    { provide: CNGX_RADIO_GROUP, useExisting: CngxRadioGroup },
    { provide: CNGX_CONTROL_VALUE, useExisting: CngxRadioGroup },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxRadioGroup },
  ],
  template: `<ng-content />`,
  styleUrl: './radio-group.component.css',
})
export class CngxRadioGroup<T = unknown>
  implements
    CngxRadioGroupContract<T>,
    CngxControlValue<T | undefined>,
    CngxFormFieldControl
{
  readonly value = model<T | undefined>(undefined);
  readonly disabled = model<boolean>(false);
  readonly required = model<boolean>(false);
  readonly invalid = model<boolean>(false);
  readonly errorMessageId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly label = input<string | undefined>(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly nameInput = input<string | undefined>(undefined, { alias: 'name' });

  protected readonly ariaBusy = computed(
    () => this.state()?.status() === 'loading',
  );

  private readonly fallbackName = nextUid('cngx-radio-group');

  readonly name = computed(() => this.nameInput() ?? this.fallbackName);

  private readonly registry = new Map<string, CngxRadioRegistration<T>>();
  private pendingArrowSelect = false;

  // ── CngxFormFieldControl ─────────────────────────────────────────

  readonly id = signal(nextUid('cngx-radio-group-')).asReadonly();

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** Empty when no radio is selected. */
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

  register(radio: CngxRadioRegistration<T>): void {
    this.registry.set(radio.id, radio);
  }

  unregister(id: string): void {
    this.registry.delete(id);
  }

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

  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.fieldHost?.markAsTouched();
  }
}
