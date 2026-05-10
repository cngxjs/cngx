import {
  DestroyRef,
  Directive,
  type EffectRef,
  effect,
  forwardRef,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CNGX_CONTROL_VALUE, type CngxControlValue } from '@cngx/common/interactive';

/**
 * Single `ControlValueAccessor` for every value-bearing cngx form atom.
 * Talks to the host through `CNGX_CONTROL_VALUE`, so atoms stay
 * Forms-agnostic and this is the only place in cngx that implements CVA.
 *
 * - Selector matches both element and attribute forms of every atom.
 * - All four CVA hooks wrap their bodies in `untracked()`. Load-bearing on
 *   `registerOnChange`: the effect reads `control.value()` then invokes
 *   `fn(value)` outside the dependency graph, so any signal `fn` touches
 *   (today via RF internals, tomorrow via signal-based RF) does not feed
 *   back into the effect.
 * - `registerOnChange` skips its first run — initial value is delivered
 *   via `writeValue` per CVA contract.
 * - `writeValue` stamps `lastSeen`; the change-listener short-circuits on
 *   `Object.is` so the RF→atom→RF round-trip never re-emits.
 *
 * @example
 * ```html
 * <form [formGroup]="form">
 *   <cngx-toggle [formControlName]="'notifications'" />
 *   <cngx-multi-chip-group [formControlName]="'tags'">
 *     <cngx-chip cngxChipInGroup *ngFor="let t of pool" [value]="t">{{ t }}</cngx-chip>
 *   </cngx-multi-chip-group>
 * </form>
 * ```
 *
 * @category directives
 */
@Directive({
  selector:
    '[cngxToggle][formControl], [cngxToggle][formControlName], cngx-toggle[formControl], cngx-toggle[formControlName], cngx-checkbox[formControl], cngx-checkbox[formControlName], [cngxCheckbox][formControl], [cngxCheckbox][formControlName], cngx-radio-group[formControl], cngx-radio-group[formControlName], [cngxRadioGroup][formControl], [cngxRadioGroup][formControlName], cngx-checkbox-group[formControl], cngx-checkbox-group[formControlName], [cngxCheckboxGroup][formControl], [cngxCheckboxGroup][formControlName], cngx-button-toggle-group[formControl], cngx-button-toggle-group[formControlName], [cngxButtonToggleGroup][formControl], [cngxButtonToggleGroup][formControlName], cngx-button-multi-toggle-group[formControl], cngx-button-multi-toggle-group[formControlName], [cngxButtonMultiToggleGroup][formControl], [cngxButtonMultiToggleGroup][formControlName], cngx-chip-group[formControl], cngx-chip-group[formControlName], [cngxChipGroup][formControl], [cngxChipGroup][formControlName], cngx-multi-chip-group[formControl], cngx-multi-chip-group[formControlName], [cngxMultiChipGroup][formControl], [cngxMultiChipGroup][formControlName], [cngxChipInteraction][formControl], [cngxChipInteraction][formControlName]',
  standalone: true,
  exportAs: 'cngxFormBridge',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CngxFormBridge),
      multi: true,
    },
  ],
  host: {
    '(focusout)': 'handleFocusOut()',
  },
})
export class CngxFormBridge<T = unknown> implements ControlValueAccessor {
  private readonly control = inject(CNGX_CONTROL_VALUE) as CngxControlValue<T>;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private onChange: ((value: T) => void) | null = null;
  private onTouched: (() => void) | null = null;

  /** Sentinel for "no value observed yet". */
  private static readonly UNSET: unique symbol = Symbol('cngx-form-bridge-unset');
  private lastSeen: T | typeof CngxFormBridge.UNSET = CngxFormBridge.UNSET;

  private effectRef: EffectRef | null = null;

  /**
   * RF → view. Stamps `lastSeen` then writes the atom's model signal; the
   * change-listener short-circuits on `Object.is` and never routes the
   * value back through `onChange`.
   */
  writeValue(value: T): void {
    untracked(() => {
      this.lastSeen = value;
      this.control.value.set(value);
    });
  }

  /**
   * Installs a tracked effect over `control.value()`. First run is the
   * post-mount baseline (CVA contract — initial value was delivered via
   * `writeValue`); every subsequent change forwards through `fn(value)`
   * inside `untracked()`.
   */
  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
    if (this.effectRef !== null) {
      return;
    }
    this.effectRef = effect(
      () => {
        const value = this.control.value();
        if (
          this.lastSeen !== CngxFormBridge.UNSET &&
          Object.is(value, this.lastSeen)
        ) {
          return;
        }
        const wasFirstObservation = this.lastSeen === CngxFormBridge.UNSET;
        this.lastSeen = value;
        if (wasFirstObservation) {
          // CVA contract: registerOnChange listens for future changes only.
          return;
        }
        const callback = this.onChange;
        if (callback === null) {
          return;
        }
        untracked(() => callback(value));
      },
      { injector: this.injector },
    );
    this.destroyRef.onDestroy(() => this.effectRef?.destroy());
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** RF → atom. Forwards the disabled flag into the atom's writable `disabled` signal. */
  setDisabledState(isDisabled: boolean): void {
    untracked(() => {
      this.control.disabled.set(isDisabled);
    });
  }

  /** Fires `onTouched` when focus leaves the atom's host element. */
  protected handleFocusOut(): void {
    const callback = this.onTouched;
    if (callback === null) {
      return;
    }
    untracked(() => callback());
  }
}
