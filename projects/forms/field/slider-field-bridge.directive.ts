import { computed, Directive, effect, inject, signal, untracked } from '@angular/core';

import { CngxSliderTrack } from '@cngx/common/interactive';

import { writeFieldValue } from './field-sync';
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

  readonly id = computed<string>(() => this.presenter?.inputId() ?? '');

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  // A numeric slider always carries a value, so it is never "empty".
  readonly empty = computed<boolean>(() => false);

  readonly disabled = computed<boolean>(() => this.presenter?.disabled() ?? false);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

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

  constructor() {
    // Field -> Slider. Equality-guarded so the inverse sync's write does not bounce.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldValue = presenter.fieldState().value();
      const next = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);
      if (!Number.isFinite(next)) {
        return;
      }
      const current = untracked(() => this.slider.value());
      if (!Object.is(current, next)) {
        this.slider.value.set(next);
      }
    });

    // Slider -> Field. `value` is a `WritableSignal` at runtime; `CngxFieldRef`
    // hides writability for API stability - narrow via writeFieldValue.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const sliderValue = this.slider.value();
      const current: unknown = untracked(() => fieldRef.value());
      if (Object.is(current, sliderValue)) {
        return;
      }
      writeFieldValue(fieldRef, sliderValue);
    });
  }

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
