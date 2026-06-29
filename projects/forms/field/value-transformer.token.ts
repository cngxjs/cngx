import { InjectionToken } from '@angular/core';

/**
 * Bidirectional contract between a directive's typed value and the DOM-visible
 * display string. `format(raw)` produces the string written to the input on
 * value-from-outside paths (writes from `<cngx-form-field [field]>`, RF
 * `setValue`, programmatic `value.set`). `parse(display)` produces the typed
 * value on user-input / blur paths.
 *
 * Orthogonal to `CNGX_FORM_FIELD_CONTROL`: that token declares "I am the
 * focusable element"; this token declares "I translate this element's value
 * channel". The same directive may provide both - they are independent
 * contracts.
 *
 * @category forms/field
 */
export interface CngxValueTransformer<T> {
  /** Produce the display string from the typed value. */
  format(raw: T): string;
  /** Produce the typed value from the display string. */
  parse(display: string): T;
}

/**
 * Resolves to the `CngxValueTransformer` a control publishes for translating
 * between its typed value and its DOM display string:
 *
 * - `format(raw)` - on value-from-outside writes (field, `setValue`, `value.set`)
 * - `parse(display)` - on user-input and blur reads
 *
 * Provided on the control's own host by the directives that intercept its
 * value channel: `CngxInputMask`, `CngxInputFormat`, `CngxNumericInput`. A host
 * that needs the typed-to-display mapping resolves it here.
 *
 * Optional and orthogonal to `CNGX_FORM_FIELD_CONTROL`: that token declares
 * "I am the focusable element", this one "I translate its value channel" - one
 * directive may provide both.
 *
 * @category forms/field
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/value-transformer.token.ts
 * @since 0.1.0
 * @relatedTo CngxValueTransformer, CNGX_FORM_FIELD_CONTROL, CngxInputMask, CngxInputFormat, CngxNumericInput
 */
export const CNGX_VALUE_TRANSFORMER = new InjectionToken<CngxValueTransformer<unknown>>(
  'CngxValueTransformer',
);
