import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract every form control fulfils when participating in a
 * `cngx-form-field` (or any future host that adopts the same shape).
 *
 * Implementations expose five reactive surfaces the host reads on every
 * change-detection cycle plus an optional imperative `focus` method. The
 * contract is value-shape-agnostic — both scalar (boolean / string /
 * undefined) and array-shaped controls satisfy it because every field is
 * a `Signal<...>` (no value-type leakage into the contract).
 *
 * **Layer note.** Lives in `@cngx/core/tokens` (Level 1) so Level-2 atoms
 * in `@cngx/common/*` can provide the token without importing from the
 * Level-3 `@cngx/forms/field` library — Sheriff-clean by construction.
 * `@cngx/forms/field` re-exports both this interface and the matching
 * token for back-compatibility with the public-API surface forms
 * consumers already depend on.
 *
 * @category interfaces
 */
export interface CngxFormFieldControl {
  /** Unique element ID for the control. */
  readonly id: Signal<string>;
  /** Whether the control currently has DOM focus. */
  readonly focused: Signal<boolean>;
  /** Whether the control's value is empty. */
  readonly empty: Signal<boolean>;
  /** Whether the control is disabled. */
  readonly disabled: Signal<boolean>;
  /** Whether the control is in an error state. */
  readonly errorState: Signal<boolean>;
  /** Programmatically focus the control. */
  focus?(options?: FocusOptions): void;
}

/**
 * Injection token provided by controls inside a `cngx-form-field` (or any
 * other host that consumes the same contract). The form-field reads this
 * to discover the active control and project ARIA back onto it.
 *
 * `@cngx/forms/field` re-exports this constant so the existing
 * `import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field'` import
 * path keeps working unchanged.
 *
 * @category tokens
 */
export const CNGX_FORM_FIELD_CONTROL = new InjectionToken<CngxFormFieldControl>(
  'CngxFormFieldControl',
);
