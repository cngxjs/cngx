import { InjectionToken, type Signal } from '@angular/core';

import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Status enum for a single step. Driven by the presenter's
 * commit-controller lifecycle plus optional `errorAggregator`
 * composition.
 *
 * @category interactive
 */
export type CngxStepStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error'
  | 'disabled'
  | 'busy';

/**
 * Step-tree node. Either a `step` (terminal, has its own panel) or
 * a `group` (carries nested children). Both share id / label /
 * disabled / state metadata; the discriminator is `kind`.
 *
 * @category interactive
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
 * Registration handle a `CngxStep` / `CngxStepGroup` passes to its
 * host (`CngxStepperPresenter` or a parent group). The host owns
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
 * Public contract atoms see when they inject the presenter via
 * {@link CNGX_STEPPER_HOST}. Mirrors the directive's surface 1:1 so
 * the atoms never reach into the concrete class.
 *
 * @category interactive
 */
export interface CngxStepperHost {
  readonly stepTree: Signal<readonly CngxStepNode[]>;
  readonly flatSteps: Signal<readonly CngxStepNode[]>;
  readonly activeStepIndex: Signal<number>;
  readonly activeStepId: Signal<string | null>;
  readonly linear: Signal<boolean>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  readonly commitState: CngxAsyncState<number | undefined>;

  select(index: number): void;
  selectNext(): void;
  selectPrevious(): void;
  selectById(id: string): void;
  reset(): void;

  // markCompleted / markErrored are intentionally NOT on the host
  // contract until Phase 3 wires the commit lifecycle. Surfacing
  // them as no-op placeholders would make consumer code silently
  // do nothing — re-introduce only with a working implementation.

  register(handle: CngxStepRegistration, parentId?: string | null): void;
  unregister(id: string): void;
}

/**
 * DI token providing the stepper presenter's contract to atoms +
 * organism shells. The presenter provides this via `useExisting`;
 * atoms `inject(CNGX_STEPPER_HOST, { optional: true })` and either
 * register with the root presenter or fall back through
 * {@link CNGX_STEP_GROUP_HOST} when nested inside a group.
 *
 * @category interactive
 */
export const CNGX_STEPPER_HOST = new InjectionToken<CngxStepperHost>(
  'CngxStepperHost',
);
