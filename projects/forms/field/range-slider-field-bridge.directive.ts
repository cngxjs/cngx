import { computed, Directive, effect, inject, signal, untracked } from '@angular/core';

import { CngxRangeSliderTrack } from '@cngx/common/interactive';

import { writeFieldValue } from './field-sync';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import type { CngxFormFieldControl } from './models';

/**
 * Bridges a `<cngx-range-slider>` (or a bare `[cngxRangeSliderTrack]`) into a
 * `<cngx-form-field>`.
 *
 * Same-element on the range-slider host. Provides `CNGX_FORM_FIELD_CONTROL` so
 * the presenter discovers the slider, two-way-syncs the bound `Field<[number,
 * number]>` value with the slider's tuple `value` model, and projects ARIA from
 * the presenter onto the host. The slider atom stays Forms-agnostic - this
 * directive is the only place that imports from `@cngx/forms/field`.
 *
 * ### Usage
 *
 * ```html
 * <cngx-form-field [field]="form.priceRange">
 *   <label cngxLabel>Price range</label>
 *   <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" [step]="10" />
 * </cngx-form-field>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/range-slider-field-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSliderFieldBridge, CngxFormField, CngxRangeSlider, adaptFormControl
 * <example-url>http://localhost:4200/#/forms/field/slider-forms/signal-forms-range-slider</example-url>
 */
@Directive({
  selector: '[cngxRangeSliderFieldBridge]',
  exportAs: 'cngxRangeSliderFieldBridge',
  standalone: true,
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxRangeSliderFieldBridge }],
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
export class CngxRangeSliderFieldBridge implements CngxFormFieldControl {
  private readonly slider = inject(CngxRangeSliderTrack, { self: true, host: true });
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  readonly id = computed<string>(() => this.presenter?.inputId() ?? '');

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  // A range slider always carries a tuple, so it is never "empty".
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
    // Field -> Slider. Tuple equality so the inverse sync's write does not bounce.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldValue = presenter.fieldState().value();
      const next = toTuple(fieldValue);
      if (!next) {
        return;
      }
      const current = untracked(() => this.slider.value());
      if (!tupleEq(current, next)) {
        this.slider.value.set(next);
      }
    });

    // Slider -> Field.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const sliderValue = this.slider.value();
      const current = untracked(() => fieldRef.value());
      if (Array.isArray(current) && tupleEq(current as readonly number[], sliderValue)) {
        return;
      }
      writeFieldValue(fieldRef, [...sliderValue]);
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

/** @internal Coerce a field value to a numeric `[start, end]` tuple, or null. */
function toTuple(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }
  const [start, end] = value as [unknown, unknown];
  if (typeof start !== 'number' || typeof end !== 'number') {
    return null;
  }
  return [start, end];
}

/** @internal */
function tupleEq(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}
