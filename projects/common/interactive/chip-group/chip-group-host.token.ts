import { inject, InjectionToken, type Signal } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

/**
 * Parent contract every chip-group molecule (`CngxChipGroup` single,
 * `CngxMultiChipGroup` multi) provides via `useExisting`.
 * `CngxChipInGroup` leaves inject this token through
 * `injectChipGroupHost()` - never the concrete group class - so the leaf stays decompose-ready and
 * free of cyclic type dependencies, and the Phase 5 split between
 * single + multi groups can share the same leaf implementation.
 *
 * Selection state is queried via `isSelected(value)` and mutated via
 * `toggle(value)` / `remove(value)`. `isDisabled` is a
 * `Signal<boolean>` so the leaf's reactive `aria-disabled` and the
 * disabled-cascade derivation track it without re-injection. Per
 * `reference_atomic_decompose` §4 - leaf communicates with its
 * parent via DI token, never via concrete parent-class injection.
 *
 * Mode (single vs multi) is intentionally NOT exposed on this
 * contract: the leaf does not branch behaviour on mode, and no
 * consumer / bridge surface in scope reads it. A future feature
 * that needs mode discovery can extend the interface then; until
 * then the field stays out of the public surface.
 *
 * @category common/interactive
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/chip-group/chip-group-host.token.ts
 * @since 0.1.0
 */
export interface CngxChipGroupHost<T = unknown> {
  isSelected(value: T): boolean;
  toggle(value: T): void;
  remove(value: T): void;
  readonly isDisabled: Signal<boolean>;
}

/**
 * DI token a `CngxChipInGroup` leaf injects to find its parent chip
 * group. Always provided via
 * `{ provide: CNGX_CHIP_GROUP_HOST, useExisting: <Self> }` - never
 * via concrete-class injection. Required on the leaf side: a leaf
 * without a parent throws `CNGX1068` at construction (fail-fast -
 * silent dual-source-of-truth would be worse).
 *
 * Standalone chips outside any group use `[cngxChipInteraction]`
 * instead, which provides `CNGX_CONTROL_VALUE` directly without ever
 * touching this token.
 *
 * @category common/interactive
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/chip-group/chip-group-host.token.ts
 * @since 0.1.0
 */
export const CNGX_CHIP_GROUP_HOST = new InjectionToken<CngxChipGroupHost>('CngxChipGroupHost');

/**
 * Inject the {@link CNGX_CHIP_GROUP_HOST} of the surrounding chip group
 * from a `CngxChipInGroup` leaf, resolved with `host: true`. Throws a
 * `CngxRuntimeError` with code `CNGX1068` when no group is above it, in
 * development and production alike.
 *
 * @internal
 */
export function injectChipGroupHost<T>(): CngxChipGroupHost<T> {
  const host = inject<CngxChipGroupHost<T>>(CNGX_CHIP_GROUP_HOST, { host: true, optional: true });
  if (!host) {
    throw new CngxRuntimeError(
      'CNGX1068',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxChipInGroup] must be placed inside <cngx-chip-group> or <cngx-multi-chip-group>.',
    );
  }
  return host;
}
