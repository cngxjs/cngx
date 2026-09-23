import { InjectionToken, type Signal } from '@angular/core';

/**
 * Visual appearance of a form control and of the field that surrounds it.
 *
 * - `outline` - hairline border on a transparent surface. The library
 *   default; it is what `cngx.base` already paints, so it emits no
 *   `data-skin` attribute at all.
 * - `fill` - tinted surface with a bottom underline that thickens on
 *   focus. The filled look without the ten nested wrappers Material needs
 *   for it; cngx ships no floating label, the label stays above the
 *   control.
 * - `bare` - no border, no surface, compact padding, underline only on
 *   focus. For controls embedded in something that already owns the box:
 *   a table filter row, an inline cell editor, a toolbar slot.
 *
 * Lives in `@cngx/core/tokens` (Level 1) next to the host contract that
 * carries it, so `@cngx/common` atoms can read the type without importing
 * the Level-3 `@cngx/forms/field` library.
 *
 * @category core/tokens
 */
export type CngxFieldSkin = 'outline' | 'fill' | 'bare';

/**
 * Narrow back-channel a form-field-aware host (typically
 * `CngxFormFieldPresenter`) exposes to the bound control.
 *
 * Two required pieces plus one optional naming channel:
 * - `showError: Signal<boolean>` - the resolved "should errors be visible
 *   right now" flag. Combines `invalid()` with the configured visibility
 *   gate (`touched`, `dirty`, `submitted`, custom strategy, ambient
 *   reveal-scope). The control reads this to decide whether to paint its
 *   own error skin (`aria-invalid`, `.cngx-...--error`).
 * - `markAsTouched(): void` - invoked by the control on focus-out so the
 *   surrounding field's "touched" state advances without the control
 *   importing the concrete presenter or field-state shape.
 * - `labelId?: Signal<string>` - stable id of the field's label element.
 *   Group-role atoms (`radiogroup` / `group` / `listbox` / `toolbar`)
 *   reference it via `aria-labelledby` when no explicit `label` input is
 *   set; group roles take no name from content, so this channel is what
 *   names them inside a `cngx-form-field`.
 * - `skin?: Signal<CngxFieldSkin | undefined>` - the field's own,
 *   unresolved appearance value. The host publishes what was bound to it
 *   and nothing else; resolving the cascade is the reader's job.
 *
 * Deliberately scoped to these members. The full presenter exposes
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
 * @category core/tokens
 */
export interface CngxFormFieldHostContract {
  /** True when errors should be visible to the user. */
  readonly showError: Signal<boolean>;
  /**
   * Marks the surrounding field as touched. Typically called from a
   * control's `focusout` host listener.
   */
  markAsTouched(): void;
  /**
   * Stable id of the field's label element (`CngxLabel`), when the host
   * renders one. Optional so hosts without a label surface keep
   * satisfying the contract; consumers read it as
   * `host.labelId?.() ?? null`.
   */
  readonly labelId?: Signal<string>;
  /**
   * The appearance bound on the host itself, unresolved. `undefined`
   * means the host was given no skin, not that it wants `'outline'` -
   * the config default still has to win in that case. Optional so hosts
   * without an appearance surface keep satisfying the contract;
   * consumers read it as `host.skin?.() ?? config.skin ?? 'outline'` and
   * own the fallback.
   */
  readonly skin?: Signal<CngxFieldSkin | undefined>;
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
 * @category core/tokens
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/tokens/form-field-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxFormFieldHostContract, CNGX_FORM_FIELD_CONTROL, CngxFormFieldPresenter, CngxFormField
 */
export const CNGX_FORM_FIELD_HOST = new InjectionToken<CngxFormFieldHostContract>(
  'CngxFormFieldHost',
);
