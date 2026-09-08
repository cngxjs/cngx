import { computed, Directive, effect, inject, untracked } from '@angular/core';

import { CngxSliderTrack } from '@cngx/common/interactive';

import { createFieldSync } from './field-sync';
import { createFieldControlAria } from './field-control-aria';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import type { CngxFormFieldControl } from './models';

/**
 * Bridges a `<cngx-slider>` (or a bare `[cngxSliderTrack]`) into a
 * `<cngx-form-field>`.
 *
 * Same-element on the slider host. Provides `CNGX_FORM_FIELD_CONTROL` so the
 * form-field presenter discovers the slider, two-way-syncs the bound `Field<T>`
 * value with the slider's `value` model, and projects ARIA attributes from the
 * presenter onto the host.
 *
 * The slider atom stays completely Forms-agnostic - this directive is the only
 * place that imports from `@cngx/forms/field` / `@angular/forms`.
 *
 * ### Usage
 *
 * ```html
 * <cngx-form-field [field]="form.volume">
 *   <label cngxLabel>Volume</label>
 *   <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" [step]="5" showValue />
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * For Reactive Forms, wrap the `FormControl` in `adaptFormControl(...)` and pass
 * the returned accessor to `[field]` - the bridge doesn't care about the source.
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/slider-field-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBindField, CngxFormField, CngxSlider, CngxListboxFieldBridge, adaptFormControl
 * <example-url>http://localhost:4200/#/forms/field/slider-forms/signal-forms-slider</example-url>
 */
@Directive({
  selector: '[cngxSliderFieldBridge]',
  exportAs: 'cngxSliderFieldBridge',
  standalone: true,
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSliderFieldBridge }],
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
export class CngxSliderFieldBridge implements CngxFormFieldControl {
  private readonly slider = inject(CngxSliderTrack, { self: true, host: true });
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  private readonly aria = createFieldControlAria(this.presenter);

  readonly id = this.aria.id;

  readonly focused = this.aria.focused;

  // A numeric slider always carries a value, so it is never "empty".
  readonly empty = computed<boolean>(() => false);

  readonly disabled = this.aria.disabled;

  readonly errorState = this.aria.errorState;

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

  constructor() {
    const presenter = this.presenter;
    if (presenter !== null) {
      // The track's disabled model gates keyboard, pointer and tabindex in the
      // atom itself - without this write a Signal-Forms-disabled field leaves
      // the slider fully operable.
      effect(() => {
        const disabled = presenter.disabled();
        untracked(() => this.slider.disabled.set(disabled));
      });
    }

    // A numeric slider always asserts its own value: an absent/non-finite field
    // is skipped on read but still seeded on write (createFieldSync's
    // shouldSkipFieldValue). Number() coercion covers string field values.
    createFieldSync<number>({
      componentValue: this.slider.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'number' ? v : Number(v)),
      shouldSkipFieldValue: (v) => !Number.isFinite(typeof v === 'number' ? v : Number(v)),
    });
  }

  /** @internal */
  protected readonly handleFocus = this.aria.handleFocusIn;

  /** @internal */
  protected readonly handleBlur = this.aria.handleFocusOut;
}
