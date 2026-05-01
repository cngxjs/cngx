import { InjectionToken, type Signal } from '@angular/core';

/**
 * Parent contract every chip-group molecule (`CngxChipGroup` single,
 * `CngxMultiChipGroup` multi) provides via `useExisting`.
 * `CngxChipInGroup` leaves inject this token (NOT optional) — never
 * the concrete group class — so the leaf stays decompose-ready and
 * free of cyclic type dependencies, and the Phase 5 split between
 * single + multi groups can share the same leaf implementation.
 *
 * Selection state is queried via `isSelected(value)` and mutated via
 * `toggle(value)` / `remove(value)`. `isMulti` and `isDisabled` are
 * `Signal<boolean>` so the leaf's reactive `aria-selected`,
 * `aria-disabled`, and disabled-cascade derivations track them
 * without re-injection. Per `reference_atomic_decompose` §4 — leaf
 * communicates with its parent via DI token, never via concrete
 * parent-class injection.
 *
 * @category interactive
 */
export interface CngxChipGroupHost<T = unknown> {
  isSelected(value: T): boolean;
  toggle(value: T): void;
  remove(value: T): void;
  readonly isMulti: Signal<boolean>;
  readonly isDisabled: Signal<boolean>;
}

/**
 * DI token a `CngxChipInGroup` leaf injects to find its parent chip
 * group. Always provided via
 * `{ provide: CNGX_CHIP_GROUP_HOST, useExisting: <Self> }` — never
 * via concrete-class injection. Required (NOT optional) on the leaf
 * side: a leaf without a parent throws `NullInjectorError` at
 * construction (fail-fast — silent dual-source-of-truth would be
 * worse).
 *
 * Standalone chips outside any group use `[cngxChipInteraction]`
 * instead, which provides `CNGX_CONTROL_VALUE` directly without ever
 * touching this token.
 *
 * @category interactive
 */
export const CNGX_CHIP_GROUP_HOST = new InjectionToken<CngxChipGroupHost>(
  'CngxChipGroupHost',
);
