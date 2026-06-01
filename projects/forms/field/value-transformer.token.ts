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
 * channel". The same directive may provide both — they are independent
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
 * Injection token for a `CngxValueTransformer`. Optional — directives that
 * intercept the value channel of a focusable element provide this token; the
 * surrounding form-field reads it to route writes through the transformer.
 *
 * @category forms/field
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/value-transformer.token.ts
 * @since 0.1.0
 */
export const CNGX_VALUE_TRANSFORMER = new InjectionToken<CngxValueTransformer<unknown>>(
  'CngxValueTransformer',
);
