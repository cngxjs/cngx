import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * Multi-select parent contract every `CngxButtonMultiToggleGroup`
 * provides via `useExisting`. `CngxButtonToggle` leaves that detect
 * a multi-mode parent (via `inject(CNGX_BUTTON_MULTI_TOGGLE_GROUP, {
 * optional: true })`) bind `aria-selected` (toolbar APG) instead of
 * `aria-checked` (radiogroup APG) AT INJECTION TIME. Mode is static
 * per atom instance — there is no `[selectionMode]` flag.
 *
 * `selectedValues` is a `ModelSignal<T[]>` so the consumer can
 * two-way-bind via `[(selectedValues)]` and the leaves can mutate
 * it on toggle. `disabled` is a read-only `Signal<boolean>` the
 * leaf combines with its own per-toggle `disabled()`.
 *
 * `isSelected(value)` returns the per-value membership signal from
 * the group's internal `SelectionController` so the leaf can render
 * `aria-selected` reactively without re-querying the array on every
 * keystroke. The signal identity is stable per value (per
 * `createSelectionController` contract) — safe to read inside a
 * `computed()` on the leaf.
 *
 * `toggle(value)` is the single mutation entry-point the leaf calls
 * on Space / Enter / click. The group routes it through its
 * controller and writes `selectedValues` accordingly.
 *
 * @category interactive
 */
export interface CngxButtonMultiToggleGroupContract<T = unknown> {
  readonly selectedValues: ModelSignal<T[]>;
  readonly disabled: Signal<boolean>;
  isSelected(value: T): Signal<boolean>;
  toggle(value: T): void;
}

/**
 * DI token a `CngxButtonToggle` leaf injects to find its multi-mode
 * parent group. Always provided via
 * `{ provide: CNGX_BUTTON_MULTI_TOGGLE_GROUP, useExisting:
 * CngxButtonMultiToggleGroup }` — never via concrete-class injection
 * (per `reference_atomic_decompose` §4).
 *
 * The leaf injects this token with `{ optional: true }` alongside
 * `CNGX_BUTTON_TOGGLE_GROUP` (also optional). Exactly one parent
 * must be present; the leaf throws a dev-mode error otherwise.
 *
 * @category interactive
 */
export const CNGX_BUTTON_MULTI_TOGGLE_GROUP =
  new InjectionToken<CngxButtonMultiToggleGroupContract>(
    'CngxButtonMultiToggleGroup',
  );
