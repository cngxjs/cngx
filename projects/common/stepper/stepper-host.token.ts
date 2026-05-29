import { InjectionToken, type Signal } from '@angular/core';

import type { CngxAsyncState, StatusTransition } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Status enum for a single step. Driven by the presenter's commit-controller
 * lifecycle plus the optional `errorAggregator`.
 *
 * @category common/stepper
 */
export type CngxStepStatus = 'idle' | 'pending' | 'success' | 'error' | 'disabled' | 'busy';

/**
 * Step-tree node. Either a terminal `step` (has its own panel) or a
 * `group` carrying nested children. Discriminated by `kind`.
 *
 * @category common/stepper
 */
export interface CngxStepNode {
  readonly id: string;
  readonly kind: 'step' | 'group';
  readonly label: Signal<string>;
  readonly disabled: Signal<boolean>;
  /** Live step status. Reactive to commit-controller + aggregator. */
  readonly state: Signal<CngxStepStatus>;
  /** Optional error aggregator signal for badge / SR phrasing. */
  readonly errorAggregator?: Signal<CngxErrorAggregatorContract | undefined>;
  /** Direct children for group nodes; empty for step nodes. */
  readonly children: readonly CngxStepNode[];
  /** DFS depth (root = 0). */
  readonly depth: number;
  /** Parent group id, or `null` for root. */
  readonly parentId: string | null;
  /** Flat-projection index inside `flatSteps()`. -1 for groups. */
  readonly flatIndex: number;
}

/**
 * Handle a `CngxStep` / `CngxStepGroup` passes to its host. The host owns
 * the registry; the atom owns its own state slot.
 *
 * @internal
 */
export interface CngxStepRegistration {
  readonly id: string;
  readonly kind: 'step' | 'group';
  readonly label: Signal<string>;
  readonly disabled: Signal<boolean>;
  readonly state: Signal<CngxStepStatus>;
  readonly errorAggregator?: Signal<CngxErrorAggregatorContract | undefined>;
}

/**
 * Contract atoms see via {@link CNGX_STEPPER_HOST}. Mirrors the
 * directive's surface 1:1 - atoms never reach the concrete class.
 *
 * @category common/stepper
 */
export interface CngxStepperHost {
  readonly stepTree: Signal<readonly CngxStepNode[]>;
  readonly flatSteps: Signal<readonly CngxStepNode[]>;
  readonly activeStepIndex: Signal<number>;
  readonly activeStepId: Signal<string | null>;
  readonly linear: Signal<boolean>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  readonly commitState: CngxAsyncState<number | undefined>;
  readonly intendedStepIndex: Signal<number | undefined>;

  /**
   * Reactive current/previous pair for the commit-state status. The
   * organism's `<span cngxLiveRegion>` reads this tracker on every
   * `pending → success / error` transition. Allocated once per
   * presenter - consumers MUST read this rather than calling
   * `createTransitionTracker` locally so the `linkedSignal` is shared.
   */
  readonly commitTransition: StatusTransition;

  /**
   * Index of the most recently refused commit target, or `undefined`
   * when no rejection is pending. Set by the rejection arm of
   * `select()`; cleared by a successful re-pick of the same target
   * or via {@link clearLastFailed}. Drives strip rejection decoration
   * and the `commitRolledBackTo` chain in `liveAnnouncement`.
   */
  readonly lastFailedIndex: Signal<number | undefined>;

  /**
   * Origin captured at commit-window open - the safe-harbour the user
   * is returned to on optimistic rollback. Resolves the origin label
   * for the `commitRolledBackTo(originLabel)` phrase. Cleared on
   * success; retained on rejection through the persistence window.
   */
  readonly originIndexDuringCommit: Signal<number | undefined>;

  select(index: number): void;
  selectNext(): void;
  selectPrevious(): void;
  selectById(id: string): void;
  reset(): void;

  /**
   * Drop the persisted {@link lastFailedIndex} flag. Idempotent;
   * safe to wire to a Dismiss button or aggregator-cleared.
   */
  clearLastFailed(): void;

  register(handle: CngxStepRegistration, parentId?: string | null): void;
  unregister(id: string): void;
}

/**
 * DI token carrying the presenter's contract to atoms + organism shells.
 * Atoms inject `optional: true` and either register here or fall through
 * {@link CNGX_STEP_GROUP_HOST} when nested in a group.
 *
 * @category common/stepper
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/stepper-host.token.ts
 * @since 0.1.0
 */
export const CNGX_STEPPER_HOST = new InjectionToken<CngxStepperHost>('CngxStepperHost');
