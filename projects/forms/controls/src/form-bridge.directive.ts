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
 * Single Reactive-Forms ControlValueAccessor bridge for every value-bearing
 * cngx form atom. Talks to the host atom through `CNGX_CONTROL_VALUE`
 * (provided by Phase-3-5 atoms) so this is the only place in cngx that
 * implements `ControlValueAccessor`. Atoms themselves stay Forms-agnostic.
 *
 * **Selector — same-element on every atom in either selector form.** Both
 * the element form (`<cngx-toggle>`) and the directive form
 * (`<div cngxToggle>`) are matched, so the bridge attaches consistently
 * regardless of how the consumer authored the atom host.
 *
 * **`untracked()` partition — belt-and-braces on all four CVA hooks.** The
 * load-bearing case is `registerOnChange`: its `effect()` body reads
 * `control.value()` (tracked, drives re-runs), then invokes the
 * consumer-supplied `fn(value)` inside `untracked(() => fn(value))` so
 * Angular Forms' internal signal writes inside `fn`
 * (e.g. `FormControl.setValue` updating its own `_pendingValue` /
 * dirty-state signals once those migrate to signals) do NOT register as
 * dependencies on the bridge's effect. Without that wrap any signal `fn`
 * touches would feed back into the effect's dependency set and produce an
 * infinite loop.
 *
 * The other three hooks (`writeValue`, `registerOnTouched` callback fire,
 * `setDisabledState`) wrap their bodies in `untracked()` defensively:
 * Angular Forms calls them imperatively (out of any effect) today, so the
 * wrap is a no-op — but it future-proofs against the Forms internals
 * migrating to a signal-effect-based control update path. Mirrors the
 * Phase-6b `errorScope.showErrors` / `strategy(...)` defensive wrap
 * pattern.
 *
 * **Initial-fire skip.** `registerOnChange(fn)` registers a listener for
 * *future* changes; the initial value is delivered via `writeValue`. The
 * effect therefore skips its first run and only fires `fn(value)` from
 * the second run onwards.
 *
 * **Loop prevention on `writeValue`.** `writeValue(v)` stamps `lastSeen`
 * before writing the model signal. The change-listener effect compares
 * the new value against `lastSeen` via `Object.is` and short-circuits
 * when they match — so the round-trip caused by RF writing into the
 * atom never spuriously emits a fresh `fn(v)` for the same value.
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

  /** Marker for "we have not yet observed any value at all". */
  private static readonly UNSET: unique symbol = Symbol('cngx-form-bridge-unset');
  private lastSeen: T | typeof CngxFormBridge.UNSET = CngxFormBridge.UNSET;

  private effectRef: EffectRef | null = null;

  /**
   * RF -> view. Pushes the value into the atom's model signal. The matching
   * change-listener effect will re-fire (because `value()` is tracked) but
   * the `lastSeen` stamp + `Object.is` short-circuit prevent the fired
   * value from being routed back into `onChange`.
   */
  writeValue(value: T): void {
    untracked(() => {
      this.lastSeen = value;
      this.control.value.set(value);
    });
  }

  /**
   * Installs a single tracked effect over `control.value()`. The first
   * effect run is the post-mount baseline (CVA contract — the initial
   * value was already delivered via `writeValue`); every subsequent
   * change forwards through `fn(value)` inside `untracked()` so the
   * consumer callback's signal reads do not become dependencies of the
   * bridge effect.
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
          // CVA contract: registerOnChange registers a listener for
          // *future* changes. The initial value was delivered via
          // writeValue (or, in non-RF flows, observed implicitly here);
          // either way, do not echo it through fn.
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

  /**
   * RF -> atom. Forwards the disabled flag into the atom's writable
   * `disabled` signal. Wrapped in `untracked()` defensively (today this
   * runs outside any effect, so the wrap is a no-op; future RF internals
   * may change that — see class JSDoc).
   */
  setDisabledState(isDisabled: boolean): void {
    untracked(() => {
      this.control.disabled.set(isDisabled);
    });
  }

  /**
   * Host listener — fires `onTouched` when focus leaves the atom's host
   * element. Wrapped in `untracked()` defensively for the same reason as
   * the other CVA hooks.
   */
  protected handleFocusOut(): void {
    const callback = this.onTouched;
    if (callback === null) {
      return;
    }
    untracked(() => callback());
  }
}
