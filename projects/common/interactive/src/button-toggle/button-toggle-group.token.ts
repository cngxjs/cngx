import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * Single-select parent contract every `CngxButtonToggleGroup` provides
 * via `useExisting`. `CngxButtonToggle` leaves inject this token (or
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` for the multi case) — never the
 * concrete group class — so the leaf stays decompose-ready and free
 * of cyclic type dependencies.
 *
 * `value` is a `ModelSignal<T | undefined>` because the group's
 * canonical value is two-way-bindable from the consumer (`[(value)]`)
 * and the active leaf writes it via `value.set(this.value())` on
 * pick. `disabled` is a read-only `Signal<boolean>` so the leaf can
 * combine it with its own per-toggle `disabled()` to compute
 * `toggleDisabled`. `name` is the HTML `name` attribute applied to
 * the group's host element for parity with native form-submission
 * tools — defaults to a `nextUid('cngx-button-toggle-group')` value
 * when the consumer does not supply one.
 *
 * @category interactive
 */
export interface CngxButtonToggleGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly disabled: Signal<boolean>;
  readonly name: Signal<string>;
  /**
   * Consume the group's "last interaction was a roving-arrow keydown"
   * flag. Called by a leaf's `(focus)` handler — when the flag is
   * true, the leaf forwards its value to the group's `value` model
   * (W3C APG auto-select-on-arrow-nav semantics, radiogroup variant)
   * and the flag is cleared so a subsequent Tab-into focus does not
   * double-select. Returns whether the group actually consumed the
   * flag, so the leaf can short-circuit redundant work.
   */
  consumePendingArrowSelect(value: T): boolean;
}

/**
 * DI token a `CngxButtonToggle` leaf injects to find its single-mode
 * parent group. Always provided via
 * `{ provide: CNGX_BUTTON_TOGGLE_GROUP, useExisting:
 * CngxButtonToggleGroup }` — never via concrete-class injection (per
 * `reference_atomic_decompose` §4).
 *
 * The leaf injects this token AND `CNGX_BUTTON_MULTI_TOGGLE_GROUP`
 * with `{ optional: true }` on both; the present token determines the
 * leaf's keyboard semantics + ARIA pattern (`aria-checked` for single,
 * `aria-selected` for multi), chosen at injection time, NOT at
 * runtime — there is no `[selectionMode]` flag.
 *
 * @category interactive
 */
export const CNGX_BUTTON_TOGGLE_GROUP =
  new InjectionToken<CngxButtonToggleGroupContract>('CngxButtonToggleGroup');
