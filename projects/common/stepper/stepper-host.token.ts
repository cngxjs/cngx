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
  /**
   * Step-only flat projection (group nodes filtered out).
   * Structural-equal via `flatStepsEqual`; the single source for any
   * step-count / step-position lookup.
   *
   * **Contract:** variant and skin organisms MUST read this signal
   * directly. Local re-derivation (e.g. `flatSteps().filter(...)`
   * inside a variant's `computed`) is rejected at review time -
   * the projection's equality contract is the load-bearing
   * invariant, and a local re-filter breaks the shape-stable
   * short-circuit that downstream consumers rely on. Add lookup
   * helpers as methods on this contract rather than re-deriving.
   *
   * @category common/stepper
   */
  readonly stepsOnly: Signal<readonly CngxStepNode[]>;
  readonly activeStepIndex: Signal<number>;
  readonly activeStepId: Signal<string | null>;

  /** Step-only count - the length of {@link stepsOnly}. */
  readonly stepCount: Signal<number>;

  /** `true` when the active step is the first one (no earlier step). */
  readonly isFirstStep: Signal<boolean>;

  /** `true` when the active step is the last one (no later step). */
  readonly isLastStep: Signal<boolean>;

  /**
   * `true` when {@link selectPrevious} would move - i.e. an enabled
   * step precedes the active one. The single gate a Back affordance
   * reads; never re-derive it from {@link stepsOnly} at the call site.
   */
  readonly canGoPrevious: Signal<boolean>;

  /**
   * `true` when {@link selectNext} would move - i.e. an enabled,
   * linear-unblocked step follows the active one. Derived from the same
   * predicates `select()` enforces, so a Next affordance can never
   * drift from the navigation it gates.
   */
  readonly canGoNext: Signal<boolean>;

  /**
   * `true` while a commit is in flight (`commitState.status() ===
   * 'pending'`). Drives the busy-disable on nav affordances. Keyed on
   * the strict `'pending'` status, consistent with the per-step busy
   * gate.
   */
  readonly busy: Signal<boolean>;

  /**
   * Label of the step {@link selectNext} would land on, or `undefined`
   * when none follows. Resolved through the enabled-step traversal so a
   * "Continue to {{ label }}" affordance announces the real target.
   */
  readonly nextStepLabel: Signal<string | undefined>;

  /**
   * Label of the step {@link selectPrevious} would land on, or
   * `undefined` when none precedes.
   */
  readonly previousStepLabel: Signal<string | undefined>;

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

  /**
   * `true` when the header at the given step-only index may be
   * navigated to: the step is enabled and not blocked by the `linear`
   * gate. The single reachability predicate a header affordance reads -
   * the organism MUST call this rather than reaching the presenter's
   * private linear-block check. Out-of-range indices return `false`.
   */
  canNavigateTo(index: number): boolean;

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
