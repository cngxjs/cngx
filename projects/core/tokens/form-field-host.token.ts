import { InjectionToken, type Signal } from '@angular/core';

/**
 * Narrow back-channel a form-field-aware host (typically
 * `CngxFormFieldPresenter`) exposes to the bound control.
 *
 * Two pieces:
 * - `showError: Signal<boolean>` — the resolved "should errors be visible
 *   right now" flag. Combines `invalid()` with the configured visibility
 *   gate (`touched`, `dirty`, `submitted`, custom strategy, ambient
 *   reveal-scope). The control reads this to decide whether to paint its
 *   own error skin (`aria-invalid`, `.cngx-...--error`).
 * - `markAsTouched(): void` — invoked by the control on focus-out so the
 *   surrounding field's "touched" state advances without the control
 *   importing the concrete presenter or field-state shape.
 *
 * Deliberately scoped to these two members. The full presenter exposes
 * many more signals (constraints, ARIA IDs, dirty / pending / readonly /
 * submitting); pulling all of them through a token would over-couple the
 * control surface to the presenter's evolution. Anything richer lives
 * inside the form-field bridge directives in `@cngx/forms/field`, not
 * inside the control atoms themselves.
 *
 * **Layer note.** Lives in `@cngx/core/tokens` (Level 1) so Level-2 atoms
 * in `@cngx/common/*` can read the contract without importing from the
 * Level-3 `@cngx/forms/field` library. Mirrors `CNGX_FORM_FIELD_CONTROL`
 * (atom-side contract) on the host side; together the two tokens form a
 * Sheriff-clean parent-child interaction surface.
 *
 * @category interfaces
 */
export interface CngxFormFieldHostContract {
  /** True when errors should be visible to the user. */
  readonly showError: Signal<boolean>;
  /**
   * Marks the surrounding field as touched. Typically called from a
   * control's `focusout` host listener.
   */
  markAsTouched(): void;
}

/**
 * Injection token resolving to the surrounding form-field-host contract,
 * if any. Provided by `CngxFormFieldPresenter` (in `@cngx/forms/field`)
 * via `useExisting` so any control mounted inside a `cngx-form-field`
 * can read `showError` and call `markAsTouched()` reactively without
 * referencing the concrete presenter class.
 *
 * Optional in standalone use: a control mounted outside a
 * `cngx-form-field` should inject with `{ optional: true }` and treat
 * the absence as "no field-level visibility gate, no touched-feedback
 * channel".
 *
 * @category tokens
 */
export const CNGX_FORM_FIELD_HOST = new InjectionToken<CngxFormFieldHostContract>(
  'CngxFormFieldHost',
);
