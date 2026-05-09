import {
  computed,
  InjectionToken,
  type Injector,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { MatTab } from '@angular/material/tabs';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import type { CngxTabHandle } from '@cngx/common/tabs';

/**
 * Wiring bundle returned from {@link createMatTabHandle}. The
 * directive holds the writable `errorAggregator` slot so the
 * `[cngxMatTabError]` per-tab attribute directive can pump bound
 * aggregators into it; `label` and `disabled` are derived inside
 * the factory from a `toSignal(matTab._stateChanges)` trigger plus
 * an imperative read of Material's current state, so consumers see
 * live updates without an explicit pump on the directive side.
 *
 * @category material-bridge
 */
export interface CngxMatTabHandleSetup {
  readonly handle: CngxTabHandle;
  /**
   * Read-only projection of the handle's reactive `label`. Mirrors
   * `handle.label` — exposed on the setup as a convenience for
   * code paths that already hold the setup ref. Always sourced from
   * the same underlying computed, never a separate writable.
   */
  readonly label: Signal<string | undefined>;
  /**
   * Read-only projection of the handle's reactive `disabled`.
   * Mirrors `handle.disabled` for the same reason as `label`.
   */
  readonly disabled: Signal<boolean>;
  readonly errorAggregator: WritableSignal<
    CngxErrorAggregatorContract | undefined
  >;
}

/**
 * Translates a Material `MatTab` into a cngx {@link CngxTabHandle}
 * plus a writable `errorAggregator` slot the
 * `[cngxMatTabError]` attribute directive binds.
 *
 * - `id` — always a fresh `idSeed()` value. The id is an internal
 *   registry key, not a label-derived slug; a label-keyed id would
 *   collide when two tabs share a label, silently overwriting the
 *   prior registration in the presenter.
 * - `label` / `disabled` — `computed` signals derived from a
 *   `toSignal(matTab._stateChanges)` trigger plus an imperative
 *   read of `matTab.textLabel` / `matTab.disabled`. Each Material
 *   `_stateChanges.next()` invalidates the computeds; the next
 *   read returns the current Material value synchronously. The
 *   prior pattern held writable backing signals and pumped them
 *   from a per-tab subscription; the computed pattern collapses
 *   the pump into the Signal graph so the directive owns no
 *   imperative subscription. Lifetime of the toSignal bridge is
 *   tied to the supplied `injector` — typically a per-tab child
 *   `EnvironmentInjector` so unregistering one tab does not affect
 *   the others. `_stateChanges` is technically a leading-underscore
 *   field in Material's typings (Material-internal convention) but
 *   is declared `readonly` on the public class surface and has been
 *   stable across Material 19/20/21 — the only practical reactive
 *   surface for `MatTab` input changes. Tracked as
 *   `tabs-accepted-debt §5` (Material-private surface couplings).
 * - `errorAggregator` — per-handle writable signal seeded at
 *   `undefined`. The `[cngxMatTabError]` attribute directive locates
 *   its target in `setupsByTab` and writes the bound
 *   `CngxErrorAggregatorContract` into this slot reactively; on
 *   directive teardown it resets the slot to `undefined`. The
 *   handle's public `errorAggregator` slot is the `.asReadonly()`
 *   projection of this writable, preserving the `CngxTabHandle`
 *   contract shape.
 *
 * @category material-bridge
 */
export function createMatTabHandle(
  matTab: MatTab,
  idSeed: () => string,
  injector: Injector,
): CngxMatTabHandleSetup {
  // Bridge Material's `_stateChanges` Subject into the Signal graph.
  // The bridge's lifetime is owned by `injector`'s `DestroyRef` —
  // the directive passes a per-tab child injector so per-tab
  // teardown is deterministic and does not leak to siblings.
  //
  // `equal: () => false` is load-bearing. Material's
  // `_stateChanges = new Subject<void>()` emits `undefined` on every
  // `next()`; the default `Object.is(undefined, undefined) === true`
  // would dedup every emission as no-change, the trigger signal
  // would never invalidate, and the dependent computeds (`label`,
  // `disabled`) would never recompute on `_stateChanges.next()`.
  // Forcing inequality flips every emission into a real signal-write
  // so the computed-derived projection picks up the latest
  // `matTab.textLabel` / `matTab.disabled` synchronously.
  const stateChangeTrigger = toSignal(matTab._stateChanges, {
    injector,
    initialValue: undefined,
    equal: () => false,
  });
  const label = computed<string | undefined>(() => {
    // Track the trigger so the computed invalidates on every
    // `_stateChanges.next()`; read `textLabel` imperatively to pull
    // the freshly-written Material value.
    stateChangeTrigger();
    return matTab.textLabel;
  });
  const disabled = computed<boolean>(() => {
    stateChangeTrigger();
    return matTab.disabled;
  });
  const errorAggregator = signal<CngxErrorAggregatorContract | undefined>(
    undefined,
  );
  // `idSeed` is `() => nextUid('cngx-mat-tab-')` per the directive's
  // injection. `nextUid` (`@cngx/core/utils`) draws from a single
  // monotonic counter shared across the whole application — every
  // `id` returned here is globally unique even when multiple
  // `[cngxMatTabs]` instances coexist, so the descriptor span id
  // `${id}-errors` minted in the parent directive cannot collide
  // across instances either.
  const id = idSeed();
  return {
    handle: {
      id,
      label,
      disabled,
      errorAggregator: errorAggregator.asReadonly(),
    },
    label,
    disabled,
    errorAggregator,
  };
}

/**
 * Factory signature for {@link createMatTabHandle}. The DI token
 * {@link CNGX_MAT_TAB_HANDLE_FACTORY} resolves to a function with
 * this exact shape — overrides match it identically.
 *
 * @category material-bridge
 */
export type CngxMatTabHandleFactory = typeof createMatTabHandle;

/**
 * DI token fronting the per-tab handle factory used by the
 * `[cngxMatTabs]` instrumentation directive. Default is
 * {@link createMatTabHandle}.
 *
 * Symmetric with the stepper sibling
 * `CNGX_MAT_STEP_HANDLE_FACTORY` and with `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`
 * — every Material-bridge logic block ships the same swap surface so
 * consumers can layer telemetry, alternate id strategies, or
 * test-environment id keying via `providers` / `viewProviders`
 * without forking the directive.
 *
 * Override capability — the swap surface separates **handle shape**
 * (factory body) from **id keying** (the supplied `idSeed` closure).
 * The directive constructs `idSeed` as `() => nextUid('cngx-mat-tab-')`
 * and hands it to the factory as a default suggestion; an override is
 * free to call it, ignore it, or replace it with a server-synced /
 * deterministic-test / consumer-domain id strategy. Both axes are
 * independently swappable from one DI seam.
 *
 * Tracked-debt: ships under family-uniformity staging (single
 * in-package consumer today). See `tabs-accepted-debt §10`.
 *
 * @example
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_MAT_TAB_HANDLE_FACTORY,
 *     useValue: ((tab, idSeed, injector) => {
 *       const setup = createMatTabHandle(tab, idSeed, injector);
 *       reportTabRegistered(setup.handle.id);
 *       return setup;
 *     }) satisfies CngxMatTabHandleFactory,
 *   },
 * ]
 * ```
 *
 * @category material-bridge
 */
export const CNGX_MAT_TAB_HANDLE_FACTORY =
  new InjectionToken<CngxMatTabHandleFactory>('CNGX_MAT_TAB_HANDLE_FACTORY', {
    providedIn: 'root',
    factory: () => createMatTabHandle,
  });
