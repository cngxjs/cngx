import { afterRenderEffect, computed, Directive, ElementRef, inject } from '@angular/core';

import { createFieldControlAria } from './field-control-aria';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import type { CngxFormFieldControl } from './models';

/**
 * Universal bridge that connects any control - Material (`<mat-select>`,
 * `<mat-chip-grid>`, …), native (`<input>`, `<select>`, `<textarea>`), a
 * custom Signal-Forms `FormValueControl<T>`, or a legacy Reactive-Forms CVA -
 * to a surrounding `<cngx-form-field>`.
 *
 * Place on the same element as the control. The directive derives `id`,
 * `empty`, `focused`, `disabled`, and `errorState` **purely from the field
 * via the presenter** - it never injects the concrete control, so it works
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
 *   <label cngxLabel>Color</label>
 *   <mat-select cngxBindField [control]="f.color">
 *     <mat-option value="red">Red</mat-option>
 *     <mat-option value="green">Green</mat-option>
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
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/bind-field.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxListboxFieldBridge, CngxFormBridge, adaptFormControl
 * @playground Material select via cngxBindField ./examples/material-bind-field/material-bind-field.component.ts
 * <example-url>http://localhost:4200/#/forms/field/listbox-forms/material-mat-select-via-cngxbindfield</example-url>
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
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // matInput binds `[id]` to its own default on the same host; last-writer-wins
    // beats our binding. Force-sync from the presenter so `<label for="…">` survives.
    afterRenderEffect(() => {
      const next = this.id();
      if (next && this.el.nativeElement.id !== next) {
        this.el.nativeElement.id = next;
      }
    });
  }

  private readonly aria = createFieldControlAria(this.presenter);

  readonly id = this.aria.id;

  readonly disabled = this.aria.disabled;

  readonly errorState = this.aria.errorState;

  readonly focused = this.aria.focused;

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

  /** @internal */
  protected readonly describedBy = this.aria.describedBy;
  /** @internal */
  protected readonly labelledBy = this.aria.labelledBy;
  /** @internal */
  protected readonly ariaInvalid = this.aria.ariaInvalid;
  /** @internal */
  protected readonly ariaRequired = this.aria.ariaRequired;
  /** @internal */
  protected readonly ariaBusy = this.aria.ariaBusy;
  /** @internal */
  protected readonly ariaErrorMessage = this.aria.ariaErrorMessage;
  /** @internal */
  protected readonly ariaReadonly = this.aria.ariaReadonly;

  /** @internal */
  protected readonly handleFocusIn = this.aria.handleFocusIn;

  /** @internal */
  protected readonly handleFocusOut = this.aria.handleFocusOut;
}
