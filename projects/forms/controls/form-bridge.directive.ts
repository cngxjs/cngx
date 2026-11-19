import {
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  type OutputRefSubscription,
  untracked,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CNGX_CONTROL_VALUE, type CngxControlValue } from '@cngx/common/interactive';

/**
 * Lets cngx's value-bearing form atoms take part in Angular Reactive Forms exactly like
 * a native `<input>`: put `[formControl]` / `[formControlName]` on the atom and its value
 * flows into `form.value`, with validation, `disabled` and `touched` wired for free.
 * Without it a `cngx-toggle` or `cngx-multi-chip-group` would be inert to reactive forms.
 *
 * This is the single `ControlValueAccessor` in cngx - it auto-applies by selector (you
 * never reference `cngxFormBridge` yourself) and talks to the host through
 * `CNGX_CONTROL_VALUE`, keeping the atoms themselves Forms-agnostic.
 *
 * Covers, in both element and attribute form: `cngx-toggle`, `cngx-checkbox`,
 * `cngx-radio-group`, `cngx-checkbox-group`, `cngx-button-toggle-group`,
 * `cngx-button-multi-toggle-group`, `cngx-chip-group`, `cngx-multi-chip-group`,
 * `[cngxChipInteraction]` (attribute only), `input[cngxInputMask]`, `input[cngxNumericInput]`
 * and `input[cngxInputFormat]` (attribute only), and `cngx-phone-input` (element only). Signal Forms (`[field]`) and the Level-3
 * select controls bypass this entirely - they provide `CNGX_FORM_FIELD_CONTROL`
 * directly. To bridge a bare self-contained external/Material CVA control into a cngx
 * field, see `CngxBindField`.
 *
 * Behaviour:
 * - `fn(value)` never joins a reactive context: the atom may write its model
 *   inside an effect, but Angular's output emit calls listeners with no active
 *   consumer, so a signal `fn` reads is never tracked (a spec pins this).
 *   `writeValue`, `setDisabledState` and the touched callback run inside
 *   `untracked()`.
 * - A write through the atom's `value` model (typing, a click, `value.set`)
 *   reaches the control synchronously via the model's `subscribe`, so a form
 *   submitted in the same task (Enter right after a keystroke) reads it.
 * - A parent `[value]` binding next to `[formControl]` is not a user change
 *   (CVA contract): it updates the atom but never the control, which stays
 *   pristine. The model's `subscribe` does not fire for an input binding.
 * - `writeValue` drops the model's synchronous echo of the value it writes, so
 *   the RF→atom→RF round-trip never re-emits; a re-entrant write of a different
 *   value still forwards.
 *
 * ```html
 * <!-- No bridge directive to add: it auto-attaches via selector to each atom below. -->
 * <form [formGroup]="form">
 *   <cngx-toggle formControlName="notifications" />
 *   <cngx-multi-chip-group formControlName="tags">
 *     @for (t of pool; track t) {
 *       <cngx-chip cngxChipInGroup [value]="t">{{ t }}</cngx-chip>
 *     }
 *   </cngx-multi-chip-group>
 * </form>
 * <!-- form.value is now { notifications: boolean; tags: string[] } -->
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/controls/form-bridge.directive.ts
 * @selector [formControl], [formControlName]
 * @since 0.1.0
 * @relatedTo CngxTypedControl, CngxBindField, CngxListboxFieldBridge
 * @axis level organism
 */
@Directive({
  selector:
    '[cngxToggle][formControl], [cngxToggle][formControlName], cngx-toggle[formControl], cngx-toggle[formControlName], cngx-checkbox[formControl], cngx-checkbox[formControlName], [cngxCheckbox][formControl], [cngxCheckbox][formControlName], cngx-radio-group[formControl], cngx-radio-group[formControlName], [cngxRadioGroup][formControl], [cngxRadioGroup][formControlName], cngx-checkbox-group[formControl], cngx-checkbox-group[formControlName], [cngxCheckboxGroup][formControl], [cngxCheckboxGroup][formControlName], cngx-button-toggle-group[formControl], cngx-button-toggle-group[formControlName], [cngxButtonToggleGroup][formControl], [cngxButtonToggleGroup][formControlName], cngx-button-multi-toggle-group[formControl], cngx-button-multi-toggle-group[formControlName], [cngxButtonMultiToggleGroup][formControl], [cngxButtonMultiToggleGroup][formControlName], cngx-chip-group[formControl], cngx-chip-group[formControlName], [cngxChipGroup][formControl], [cngxChipGroup][formControlName], cngx-multi-chip-group[formControl], cngx-multi-chip-group[formControlName], [cngxMultiChipGroup][formControl], [cngxMultiChipGroup][formControlName], [cngxChipInteraction][formControl], [cngxChipInteraction][formControlName], input[cngxInputMask][formControl], input[cngxInputMask][formControlName], input[cngxNumericInput][formControl], input[cngxNumericInput][formControlName], input[cngxInputFormat][formControl], input[cngxInputFormat][formControlName], cngx-phone-input[formControl], cngx-phone-input[formControlName]',
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
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class CngxFormBridge<T = unknown> implements ControlValueAccessor {
  private readonly control = inject(CNGX_CONTROL_VALUE) as CngxControlValue<T>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private onChange: ((value: T) => void) | null = null;
  private onTouched: (() => void) | null = null;

  /**
   * The value `writeValue` is writing, until the model echoes it once. Only that
   * echo is dropped; a different value written re-entrantly (a `(valueChange)`
   * handler normalising it) still forwards.
   */
  private echo: { readonly value: T } | null = null;

  private subscription: OutputRefSubscription | null = null;

  /**
   * RF → view. Writes the atom's model signal; the model emits synchronously
   * inside `set`, and the one-shot `echo` keeps that emit out of `onChange`.
   */
  writeValue(value: T): void {
    untracked(() => {
      this.echo = { value };
      try {
        this.control.value.set(value);
      } finally {
        this.echo = null;
      }
    });
  }

  /**
   * Forwards every atom write through the `value` model's `set` into
   * `fn(value)`, synchronously. Only the atom's own writes reach this path:
   * a parent `[value]` binding updates the model without emitting, so it never
   * dirties the control. The model emits only on a real change, and the
   * `writeValue` echo is dropped, so every forward is one user change.
   */
  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
    if (this.subscription !== null) {
      return;
    }
    this.subscription = this.control.value.subscribe((value) => this.forward(value));
    this.destroyRef.onDestroy(() => this.subscription?.unsubscribe());
  }

  private forward(value: T): void {
    if (this.echo !== null && Object.is(value, this.echo.value)) {
      this.echo = null;
      return;
    }
    const callback = this.onChange;
    if (callback === null) {
      return;
    }
    callback(value);
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

  /**
   * Fires `onTouched` when focus leaves the atom's host subtree. A move between
   * the parts of a composite host (a group's items, the phone input's country
   * picker and number field) keeps the control untouched: a composite is one control.
   */
  protected handleFocusOut(event: FocusEvent): void {
    const callback = this.onTouched;
    if (callback === null) {
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) {
      return;
    }
    untracked(() => callback());
  }
}
