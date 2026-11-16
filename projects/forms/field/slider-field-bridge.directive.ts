import { computed, Directive, ElementRef, inject } from '@angular/core';

import { CngxSliderTrack } from '@cngx/common/interactive';
import { cngxDevWarn } from '@cngx/utils';

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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/slider-field-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBindField, CngxFormField, CngxSlider, CngxListboxFieldBridge, adaptFormControl
 * <example-url>/#/forms/field/slider-forms/signal-forms-slider</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSliderFieldBridge]',
  exportAs: 'cngxSliderFieldBridge',
  standalone: true,
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSliderFieldBridge }],
  host: {
    '[id]': 'id()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
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
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // The track's own disabled input stays the consumer's: it is OR-ed with
  // the field here and inside the track, never overwritten.
  private readonly aria = createFieldControlAria(this.presenter, {
    localDisabled: () => this.slider.disabled(),
  });

  readonly id = this.aria.id;

  readonly focused = this.aria.focused;

  // A numeric slider always carries a value, so it is never "empty".
  readonly empty = computed<boolean>(() => false);

  readonly disabled = this.aria.disabled;

  readonly errorState = this.aria.errorState;

  /** Focuses the slider; the error summary and `focusFirstError` reach it here. */
  focus(options?: FocusOptions): void {
    this.hostEl.focus(options);
  }

  /** @internal */
  protected readonly labelledBy = this.aria.labelledBy;
  /** @internal */
  protected readonly ariaInvalid = this.aria.ariaInvalid;
  /** @internal */
  protected readonly ariaBusy = this.aria.ariaBusy;
  /** @internal */
  protected readonly ariaErrorMessage = this.aria.ariaErrorMessage;
  /** @internal */
  protected readonly ariaReadonly = this.aria.ariaReadonly;

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode && !this.presenter) {
      cngxDevWarn(
        'CNGX2015',
        '[cngxSliderFieldBridge] has no form field to bind to, so it does nothing. Place it inside ' +
          '<cngx-form-field [field]="...">.',
      );
    }
    // The track reads the field's disabled state and description through
    // CNGX_FORM_FIELD_HOST and stays the single writer of aria-describedby.

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
