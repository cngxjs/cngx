import { signal, type WritableSignal } from '@angular/core';
import type { MatTab } from '@angular/material/tabs';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import type { CngxTabHandle } from '@cngx/common/tabs';

/**
 * Wiring bundle returned from {@link createMatTabHandle}. The
 * directive holds the writable backing signals so it can pump them
 * from `MatTab._stateChanges` whenever Material's reactive inputs
 * change at runtime; the presenter only sees the read-only contract
 * via `handle`.
 *
 * @category material-bridge
 */
export interface CngxMatTabHandleSetup {
  readonly handle: CngxTabHandle;
  readonly label: WritableSignal<string | undefined>;
  readonly disabled: WritableSignal<boolean>;
  readonly errorAggregator: WritableSignal<CngxErrorAggregatorContract | undefined>;
}

/**
 * Translates a Material `MatTab` into a cngx {@link CngxTabHandle}
 * plus the writable backing signals the directive uses to keep
 * `label` / `disabled` in sync with Material's runtime inputs.
 *
 * - `id` — always a fresh `idSeed()` value. The id is an internal
 *   registry key, not a label-derived slug; a label-keyed id would
 *   collide when two tabs share a label, silently overwriting the
 *   prior registration in the presenter.
 * - `label` / `disabled` — writable signals seeded from the
 *   `MatTab` snapshot. The directive subscribes to
 *   `MatTab._stateChanges` and pumps these signals on every Material
 *   input change so consumers' `presenter.tabs()[i].disabled()` /
 *   `.label()` reads always reflect the current Material input.
 *   `_stateChanges` is technically a leading-underscore field in
 *   Material's typings (Material-internal convention) but is
 *   declared `readonly` on the public class surface and has been
 *   stable across Material 19/20/21 — the only practical reactive
 *   surface for `MatTab` input changes. Tracked as a coupling point
 *   to revisit on Material upgrades.
 * - `errorAggregator` — defaulted to `signal(undefined)` (the
 *   instrumentation path does not bind cngx error-aggregation
 *   per `MatTab`; Material's own visual error surface stays
 *   authoritative).
 *
 * @category material-bridge
 */
export function createMatTabHandle(
  matTab: MatTab,
  idSeed: () => string,
): CngxMatTabHandleSetup {
  const label = signal<string | undefined>(matTab.textLabel);
  const disabled = signal<boolean>(matTab.disabled);
  const errorAggregator = signal<CngxErrorAggregatorContract | undefined>(undefined);
  const id = idSeed();
  return {
    handle: {
      id,
      label: label.asReadonly(),
      disabled: disabled.asReadonly(),
      errorAggregator: errorAggregator.asReadonly(),
    },
    label,
    disabled,
    errorAggregator,
  };
}
