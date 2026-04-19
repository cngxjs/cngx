import { computed, InjectionToken, signal, type Signal } from '@angular/core';

import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import {
  runCommitAction,
  type CngxCommitHandle,
} from './commit-action.runtime';
import type { CngxSelectCommitAction } from './commit-action.types';

/**
 * Outcome handlers passed to `controller.begin(...)`. The controller
 * invokes exactly one of `onSuccess` / `onError` per commit lifecycle
 * (unless the commit is superseded, in which case neither fires).
 *
 * @internal
 */
export interface CngxCommitBeginHandlers<T> {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown, previous: T | undefined) => void;
}

/**
 * Encapsulated state machine for the select family's async-commit
 * lifecycle. The CngxSelect component owns exactly one instance and
 * delegates:
 *
 * - every `CngxAsyncState<T | undefined>` read (consumed by `CNGX_STATEFUL`
 *   bridges, commit-error templates, the pending-option-spinner signal);
 * - begin / cancel orchestration including supersede semantics;
 * - the "intended option" signal that drives the pending-spinner on the
 *   specific row the user just clicked.
 *
 * **Why extract this.**
 * Before extraction, the commit flow was scattered across five private
 * fields on `CngxSelect` (`commitStateSlot`, `commitIdCounter`,
 * `cancelActiveCommit`, `lastCommitIntendedState`, `lastCommittedValue`)
 * plus a snapshot effect. The fields depended on each other implicitly —
 * changing one required reading the rest. Moving the whole cluster into a
 * dedicated, signal-based controller gives us three things:
 *
 * 1. A single, unit-testable state machine. Supersede races and outcome
 *    ordering can be verified without an Angular TestBed.
 * 2. A stable surface for the upcoming `CngxMultiSelect` / `CngxCombobox`
 *    components — they'll instantiate the same controller with the same
 *    `begin(...)` shape.
 * 3. A cleaner component: CngxSelect no longer tracks commit plumbing in
 *    its own body, it just wires inputs → controller → template.
 *
 * The controller is intentionally **not** an Angular service or provider.
 * It's a plain factory so it works in any injection context (including
 * outside Angular, for headless tests).
 *
 * @internal
 */
export interface CngxCommitController<T> {
  /** Read-only async-state view of the commit lifecycle. */
  readonly state: CngxAsyncState<T | undefined>;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean>;

  /**
   * The most recent intended value (the one the user tried to commit).
   * Used by the option-row spinner and the commit-error template context
   * to identify *which* option the failure belongs to.
   */
  readonly intendedValue: Signal<T | undefined>;

  /**
   * Start a new commit. Supersedes any in-flight commit: the previous
   * one's callbacks will be no-ops, and if the previous action was an
   * Observable, its subscription is torn down.
   *
   * @param action   the async write handler (Observable/Promise/sync)
   * @param intended the value the user clicked
   * @param previous the value to roll back to on error
   * @param handlers success/error routes — the controller only updates
   *                 its own state and calls these; it does NOT touch
   *                 `value`, panel open state, or outputs.
   */
  begin(
    action: CngxSelectCommitAction<T>,
    intended: T | undefined,
    previous: T | undefined,
    handlers: CngxCommitBeginHandlers<T>,
  ): void;

  /**
   * Abort the currently in-flight commit without firing callbacks.
   * Use when the host component is destroyed or the commit-action input
   * changes mid-flight.
   */
  cancel(): void;
}

/**
 * Factory for the commit controller.
 *
 * **Why a factory (not a class).**
 * Signal-first libraries favour plain functions returning objects of
 * signals over class hierarchies. The controller has no inheritance
 * concerns, no lifecycle hooks, and no DI-visible identity — a factory
 * matches the rest of the repo (`createManualState`, `createAsyncState`,
 * `createTransitionTracker`). See `reference_api_prefix_convention.md`.
 *
 * @internal
 */
export function createCommitController<T>(): CngxCommitController<T> {
  // Writable state slot — the `state` getter returns the read-only
  // `CngxAsyncState<T | undefined>` view so consumers can't bypass the
  // controller to flip status directly.
  const slot: ManualAsyncState<T | undefined> = createManualState<T | undefined>();

  // Monotonic commit id. Incremented on every `begin(...)`. An outcome
  // callback checks its captured id against the current counter — if a
  // newer commit has started, the callback is ignored (supersede).
  let commitId = 0;

  // Cancel handle for the action currently in flight. Replaced on each
  // `begin(...)` and cleared after the action settles.
  let active: CngxCommitHandle | null = null;

  // Public signal: what the user was trying to commit. Exposed so the
  // template can render a pending spinner on THAT specific option row
  // and the commit-error context can surface it.
  const intendedState = signal<T | undefined>(undefined);

  return {
    state: slot,
    isCommitting: computed(() => slot.isPending()),
    intendedValue: intendedState.asReadonly(),

    begin(action, intended, previous, handlers) {
      // Supersede: tear down any previous in-flight action. Must run
      // BEFORE we bump `commitId` — otherwise the previous callback's
      // supersede-check would pass and fire after all.
      active?.cancel();
      const id = ++commitId;
      intendedState.set(intended);
      slot.set('pending');

      active = runCommitAction<T>(action, intended, {
        onSuccess: (committed) => {
          // Supersede guard. `commitId` advances on every new `begin`;
          // if our captured id is stale, a newer commit has taken over.
          if (id !== commitId) {
            return;
          }
          slot.setSuccess(committed);
          active = null;
          handlers.onSuccess(committed);
        },
        onError: (err) => {
          if (id !== commitId) {
            return;
          }
          slot.setError(err);
          active = null;
          handlers.onError(err, previous);
        },
      });
    },

    cancel() {
      active?.cancel();
      active = null;
      // Bump the id so any pending callbacks from the aborted action
      // are treated as superseded and do nothing.
      commitId++;
    },
  };
}

/**
 * Factory signature for producing {@link CngxCommitController} instances.
 * Consumers override the DI token {@link CNGX_SELECT_COMMIT_CONTROLLER_FACTORY}
 * with a custom factory to inject retry-with-backoff, offline queues,
 * telemetry, or any other enterprise-specific commit lifecycle — without
 * forking the select components.
 *
 * @category interactive
 */
export type CngxSelectCommitControllerFactory = <T>() => CngxCommitController<T>;

/**
 * DI token carrying the factory that every select variant uses to
 * allocate its commit controller. Default `providedIn: 'root'` factory
 * returns {@link createCommitController}. Override globally via app
 * providers or per-component via `viewProviders`.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
 *       useValue: <T>() => createRetryingCommitController<T>({ attempts: 3 }),
 *     },
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export const CNGX_SELECT_COMMIT_CONTROLLER_FACTORY =
  new InjectionToken<CngxSelectCommitControllerFactory>(
    'CngxSelectCommitControllerFactory',
    {
      providedIn: 'root',
      factory: () => createCommitController,
    },
  );
