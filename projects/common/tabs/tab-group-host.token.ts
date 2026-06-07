import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

import type { CngxAsyncState, StatusTransition } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Registration handle a `CngxTab` atom passes to its presenter via
 * {@link CngxTabGroupHost.register}. Fields are exposed by reference
 * so subsequent input changes propagate without re-registration.
 * `errorAggregator` is a `Signal<...>` slot so consumer aggregators
 * resolved via `viewChild` after first registration still bind.
 *
 * @category common/tabs
 */
export interface CngxTabHandle {
  readonly id: string;
  readonly label: Signal<string | undefined>;
  readonly disabled: Signal<boolean>;
  readonly errorAggregator: Signal<CngxErrorAggregatorContract | undefined>;
  /**
   * Per-tab closable override. `undefined` (default) inherits the
   * group-level `closable` resolution; `true`/`false` pin this tab's
   * close affordance regardless of the group default (e.g. a
   * non-closable "Home" tab inside an otherwise dismissable group).
   */
  readonly closable: Signal<boolean | undefined>;
}

/**
 * Payload of {@link CngxTabGroupHost.tabClose}. Carries the closed
 * tab's id and its index at close time. The consumer removes the tab
 * from its own data in response; the presenter has already moved the
 * active index to the surviving neighbour.
 *
 * @category common/tabs
 */
export interface CngxTabCloseEvent {
  readonly id: string;
  readonly index: number;
}

/**
 * Contract atoms see when they inject the presenter via
 * {@link CNGX_TAB_GROUP_HOST}. Atoms never reach into the concrete
 * class - keeps layering cycle-free and the decompose schematic clean.
 *
 * @category common/tabs
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
   * Reactive current/previous pair for the commit-state status. Lets
   * organisms and skin sub-components derive transition-driven
   * announcements (`pending` → `success`, `pending` → `error`, sync
   * `idle` → `error`) from a single tracker.
   */
  readonly commitTransition: StatusTransition;

  /**
   * Tab index of the last refused commit (both optimistic and
   * pessimistic modes). Cleared on next successful re-pick of the
   * same index or via {@link clearLastFailed}. Drives the persistent
   * rejection-icon decoration.
   *
   * @remarks
   * The `pending → error` pulse keyframe (`cngx-tab-pulse-error`)
   * does not retrigger on rapid supersede sequences - CSS animations
   * only fire on fresh class application. See `tabs-accepted-debt §3`;
   * the persistent icon plus static red outline carry the durable
   * signal in the no-pulse case.
   */
  readonly lastFailedIndex: Signal<number | undefined>;

  /**
   * Safe-harbour origin index captured at the start of an active
   * commit window. Written when `select()` opens a transition under
   * `commitAction`; retained on `error` so the live-region phrase
   * can resolve the origin label; cleared on `success`. Outside the
   * commit window the slot may carry a stale value - consumers must
   * gate reads by joining with `lastFailedIndex`. The origin is
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
   * Request closing the tab with the given id. The presenter moves the
   * active index onto the surviving neighbour (APG: next tab, or the
   * previous one when closing the last tab) and emits `tabClose`; the
   * consumer performs the actual removal from its data. No-op for an
   * unknown id.
   */
  requestClose(id: string): void;

  /**
   * Request adding a new tab. Emits `tabAdd`; the consumer appends to
   * its data. The presenter owns no tab-creation logic - tabs are
   * derived from consumer data (Ableitung statt Verwaltung).
   */
  requestAdd(): void;

  /**
   * Clear {@link lastFailedIndex} without unwinding
   * {@link originIndexDuringCommit} (consumers gate reads on
   * `lastFailedIndex` anyway). Call when the bound data source
   * changes and the rollback marker is no longer meaningful.
   */
  clearLastFailed(): void;
}

/**
 * DI token for the tab presenter's contract. Presenter provides via
 * `useExisting`; `CngxTab` injects to register; the organism injects
 * to drive the APG tablist keyboard model (automatic activation via
 * `select()`, roving stop derived from `activeId`) through
 * `createTabKeyboardNav`.
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab-group-host.token.ts
 * @since 0.1.0
 */
export const CNGX_TAB_GROUP_HOST = new InjectionToken<CngxTabGroupHost>('CngxTabGroupHost');
