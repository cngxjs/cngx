import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

import type { CngxAsyncState, StatusTransition } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Registration handle a `CngxTab` atom passes to its presenter via
 * {@link CngxTabGroupHost.register}. The handle exposes the atom's
 * reactive fields by reference; the presenter never copies them, so
 * subsequent input changes propagate without re-registration.
 *
 * `errorAggregator` is intentionally a `Signal<...>` slot rather than
 * a static handle — consumer-supplied aggregators may be created
 * per-instance via `viewChild` queries that resolve after the first
 * registration.
 *
 * @category interactive
 */
export interface CngxTabHandle {
  readonly id: string;
  readonly label: Signal<string | undefined>;
  readonly disabled: Signal<boolean>;
  readonly errorAggregator: Signal<CngxErrorAggregatorContract | undefined>;
}

/**
 * Public contract atoms see when they inject the presenter via
 * {@link CNGX_TAB_GROUP_HOST}. Mirrors the directive's surface 1:1
 * so atoms never reach into the concrete class — keeps the layer
 * cycle-free and the decompose schematic happy.
 *
 * @category interactive
 */
export interface CngxTabGroupHost {
  readonly tabs: Signal<readonly CngxTabHandle[]>;
  readonly activeIndex: ModelSignal<number>;
  readonly activeId: Signal<string | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  readonly loop: Signal<boolean>;
  readonly commitState: CngxAsyncState<number | undefined>;
  readonly intendedIndex: Signal<number | undefined>;
  /**
   * Reactive current/previous pair for the commit-state status —
   * lets organisms and skin sub-components derive declarative
   * transition-driven announcements (`pending` → `success`,
   * `pending` → `error`, sync `idle` → `error`) without
   * re-instantiating the tracker per consumer.
   */
  readonly commitTransition: StatusTransition;

  /**
   * The tab index whose last commit attempt was refused. Set by
   * the presenter on commit reject (both optimistic and pessimistic
   * modes). Cleared on the next successful re-pick of that same
   * index, or on explicit consumer dismissal via
   * {@link clearLastFailed}. Drives the persistent rejection-icon
   * decoration in Level-4 organism shells.
   */
  readonly lastFailedIndex: Signal<number | undefined>;

  /**
   * The "safe-harbour" index captured at the start of an active
   * commit window — written when a `commitAction` is bound and
   * `select()` opens a transition; retained when the commit
   * settles to `error` so the live-region announcement can
   * resolve the origin tab's label for the rich rollback phrase;
   * cleared when the commit settles to `success`. The producer
   * does not gate the value — outside the commit window the slot
   * may carry a stale-but-undefined value (initial state) or a
   * stale-from-prior-error value (after a rejected commit until
   * the next successful one). Consumers (the organism's
   * `liveAnnouncement` computed and any sibling SR pipeline)
   * gate reads by joining with `lastFailedIndex` — origin is
   * meaningful only when `lastFailedIndex !== undefined`.
   */
  readonly originIndexDuringCommit: Signal<number | undefined>;

  register(handle: CngxTabHandle): void;
  unregister(id: string): void;

  select(index: number): void;
  selectNext(): void;
  selectPrevious(): void;
  selectById(id: string): void;

  /**
   * Clear the persisted {@link lastFailedIndex} flag without
   * unwinding {@link originIndexDuringCommit} (which remains
   * gated by `lastFailedIndex` in any consumer that reads it).
   * Consumers call this when their bound data source changes and
   * the rollback marker is no longer meaningful.
   */
  clearLastFailed(): void;
}

/**
 * DI token providing the tab presenter's contract to atoms +
 * organism shells + the overflow molecule. The presenter provides
 * this via `useExisting`; `CngxTab` injects it to register; the
 * Level-4 organism injects it to forward keyboard nav from
 * `CngxRovingTabindex`.
 *
 * @category interactive
 */
export const CNGX_TAB_GROUP_HOST = new InjectionToken<CngxTabGroupHost>(
  'CngxTabGroupHost',
);
