import { computed, Directive, inject, signal } from '@angular/core';

import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import type { CngxFormFieldControl } from './models';

/**
 * Universal bridge that connects any control — Material (`<mat-select>`,
 * `<mat-chip-grid>`, …), native (`<input>`, `<select>`, `<textarea>`), a
 * custom Signal-Forms `FormValueControl<T>`, or a legacy Reactive-Forms CVA —
 * to a surrounding `<cngx-form-field>`.
 *
 * Place on the same element as the control. The directive derives `id`,
 * `empty`, `focused`, `disabled`, and `errorState` **purely from the field
 * via the presenter** — it never injects the concrete control, so it works
 * uniformly across control types.
 *
 * Value flow is out of scope here: it runs through the host element's own
 * bindings (`[control]` for Signal Forms, `[formControl]` for Reactive
 * Forms). This directive only projects form-field ARIA/state onto the host.
 *
 * For cngx-native atoms with exotic value semantics (multi-select,
 * `compareWith`, …), write a specialised bridge (see `CngxListboxFieldBridge`).
 *
 * ### Usage (Signal Forms + mat-select)
 *
 * ```html
 * <cngx-form-field [field]="f.color">
 *   <label cngxLabel>Farbe</label>
 *   <mat-select cngxBindField [control]="f.color">
 *     <mat-option value="red">Rot</mat-option>
 *     <mat-option value="green">Grün</mat-option>
 *   </mat-select>
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * ### Usage (Reactive Forms + custom control)
 *
 * ```html
 * <cngx-form-field [field]="adapted">
 *   <label cngxLabel>Phone</label>
 *   <my-phone-input cngxBindField [formControl]="ctrl" />
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxBindField]',
  standalone: true,
  exportAs: 'cngxBindField',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxBindField }],
  host: {
    '[id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
})
export class CngxBindField implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly id = computed<string>(() => this.presenter?.inputId() ?? '');

  readonly disabled = computed<boolean>(() => this.presenter?.disabled() ?? false);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /**
   * Heuristic empty detection derived from the field's value signal:
   * - `null` / `undefined` → empty
   * - empty array → empty
   * - empty string → empty
   * - everything else → non-empty
   *
   * Controls with exotic value shapes (e.g. `{ start: Date; end: Date }`)
   * should use a specialised bridge instead.
   */
  readonly empty = computed<boolean>(() => {
    const presenter = this.presenter;
    if (!presenter) {
      return true;
    }
    const v: unknown = presenter.fieldState().value();
    if (v == null) {
      return true;
    }
    if (Array.isArray(v)) {
      return v.length === 0;
    }
    if (typeof v === 'string') {
      return v.length === 0;
    }
    return false;
  });

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

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleFocusIn(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleFocusOut(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }
}
