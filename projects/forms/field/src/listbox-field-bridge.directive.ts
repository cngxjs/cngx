import { computed, Directive, effect, inject, signal, untracked } from '@angular/core';

import { CngxListbox } from '@cngx/common/interactive';

import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import type { CngxFieldRef, CngxFormFieldControl } from './models';

/**
 * Bridges a `CngxListbox` into a `<cngx-form-field>`.
 *
 * Same-element on the listbox host. Provides `CNGX_FORM_FIELD_CONTROL` so the
 * form-field presenter discovers the listbox, syncs the bound `Field<T>`
 * value with `listbox.value` / `listbox.selectedValues` (single / multi
 * mode), and projects ARIA attributes from the presenter onto the host.
 *
 * The listbox atom stays completely Forms-agnostic — this directive is the
 * only place that imports from `@cngx/forms/field` / `@angular/forms`.
 *
 * ### Usage
 *
 * ```html
 * <cngx-form-field [field]="form.color">
 *   <label cngxLabel>Farbe</label>
 *   <div cngxListbox cngxListboxFieldBridge [label]="'Farbe'" tabindex="0">
 *     <div cngxOption value="red">Rot</div>
 *     <div cngxOption value="green">Grün</div>
 *     <div cngxOption value="blue">Blau</div>
 *   </div>
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * For Reactive Forms, wrap the `FormControl` in `adaptFormControl(...)` and
 * pass the returned accessor to `[field]` — the bridge doesn't care about the
 * source.
 *
 * @category directives
 */
@Directive({
  selector: '[cngxListboxFieldBridge]',
  exportAs: 'cngxListboxFieldBridge',
  standalone: true,
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxListboxFieldBridge }],
  host: {
    '[id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'handleFocus()',
    '(focusout)': 'handleBlur()',
  },
})
export class CngxListboxFieldBridge implements CngxFormFieldControl {
  private readonly listbox = inject(CngxListbox, { self: true, host: true });
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly id = computed<string>(() => this.presenter?.inputId() ?? '');

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly empty = computed<boolean>(() => this.listbox.selected().length === 0);

  readonly disabled = computed<boolean>(() => this.presenter?.disabled() ?? false);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  // ── Host ARIA bindings ─────────────────────────────────────────────

  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);
  /** @internal */
  protected readonly labelledBy = computed(() => this.presenter?.labelId() ?? null);
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.errorState() ? true : null));
  /** @internal */
  protected readonly ariaRequired = computed(() => (this.presenter?.required() ? true : null));
  /** @internal */
  protected readonly ariaBusy = computed(() => (this.presenter?.pending() ? true : null));
  /** @internal */
  protected readonly ariaErrorMessage = computed(() =>
    this.errorState() ? (this.presenter?.errorId() ?? null) : null,
  );
  /** @internal */
  protected readonly ariaReadonly = computed(() => (this.presenter?.readonly() ? true : null));

  // ── Value sync ─────────────────────────────────────────────────────

  constructor() {
    // Field → Listbox: whenever the bound field value changes, push into the
    // listbox's model signal. Guarded with an equality check so that a write
    // triggered by the inverse sync doesn't bounce back.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef: CngxFieldRef = presenter.fieldState();
      const fieldValue = fieldRef.value();
      if (this.listbox.multiple()) {
        const current = untracked(() => this.listbox.selectedValues());
        const next = Array.isArray(fieldValue) ? [...(fieldValue as unknown[])] : [];
        if (!arrayEq(current, next)) {
          this.listbox.selectedValues.set(next);
        }
      } else {
        const current = untracked(() => this.listbox.value());
        if (!Object.is(current, fieldValue)) {
          this.listbox.value.set(fieldValue);
        }
      }
    });

    // Listbox → Field: when the user clicks / keyboard-selects, push into the
    // bound field's writable value signal. Both the mock and the real Signal
    // Forms field expose `value` as a `WritableSignal` at runtime; the type in
    // `CngxFieldRef` hides writability for API stability, so we downcast via a
    // narrow helper.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const listboxValue: unknown = this.listbox.multiple()
        ? [...this.listbox.selectedValues()]
        : this.listbox.value();
      const current: unknown = untracked(() => fieldRef.value());
      if (Object.is(current, listboxValue)) {
        return;
      }
      if (
        this.listbox.multiple() &&
        Array.isArray(current) &&
        Array.isArray(listboxValue) &&
        arrayEq(current as readonly unknown[], listboxValue as readonly unknown[])
      ) {
        return;
      }
      writeFieldValue(fieldRef, listboxValue);
    });
  }

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }
}

function arrayEq(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Writes `value` into `fieldRef.value` when it exposes a `WritableSignal`.
 * Both the mock-field helper (tests) and the real Signal Forms `FieldState`
 * satisfy this at runtime; `CngxFieldRef` hides the writability for API
 * stability, so we branch by capability check instead of type-system
 * contortions.
 */
function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signal = fieldRef.value as unknown;
  if (
    typeof signal === 'function' &&
    'set' in signal &&
    typeof (signal as { set: unknown }).set === 'function'
  ) {
    (signal as { set: (v: unknown) => void }).set(value);
  }
}
