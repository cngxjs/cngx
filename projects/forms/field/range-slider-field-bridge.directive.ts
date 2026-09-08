import { computed, Directive, effect, inject, untracked } from '@angular/core';

import { CngxRangeSliderTrack } from '@cngx/common/interactive';

import { createFieldSync } from './field-sync';
import { createFieldControlAria } from './field-control-aria';
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

  private readonly aria = createFieldControlAria(this.presenter);

  readonly id = this.aria.id;

  readonly focused = this.aria.focused;

  // A range slider always carries a tuple, so it is never "empty".
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
      // the range slider fully operable.
      effect(() => {
        const disabled = presenter.disabled();
        untracked(() => this.slider.disabled.set(disabled));
      });
    }

    // A range slider always asserts its own tuple: a non-tuple field is skipped
    // on read but still seeded on write. `toFieldValue` spreads so the field
    // owns a fresh array. The coerceFromField fallback is unreachable -
    // shouldSkipFieldValue guarantees a valid tuple by the time it runs.
    createFieldSync<[number, number]>({
      componentValue: this.slider.value,
      valueEquals: tupleEq,
      coerceFromField: (v) => toTuple(v) ?? [0, 0],
      shouldSkipFieldValue: (v) => toTuple(v) === null,
      toFieldValue: (v) => [...v],
    });
  }

  /** @internal */
  protected readonly handleFocus = this.aria.handleFocusIn;

  /** @internal */
  protected readonly handleBlur = this.aria.handleFocusOut;
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
