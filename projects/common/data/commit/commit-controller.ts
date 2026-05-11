import { computed, signal, type Signal } from '@angular/core';

import { createManualState, type ManualAsyncState } from '../async-state';
import type { CngxAsyncState } from '@cngx/core/utils';

/**
 * Cancel handle returned by a {@link CngxCommitRunner}. The controller
 * stores it on every `begin(...)` and calls `cancel()` synchronously
 * when a newer commit supersedes it. Action runtimes (RxJS subscription
 * teardown, AbortController abort, plain flag) implement the handle
 * however they need.
 *
 * @category interactive
 */
export interface CngxCommitHandle {
  readonly cancel: () => void;
}

/**
 * Action runner contract. Receives the controller's success/error
 * routes and returns a cancel handle. The runner is opaque to the
 * controller — it can wrap any async source (Observable, Promise,
 * sync value) and any cancellation primitive.
 *
 * Variants supply their own runner adapter (e.g. select's
 * `runCommitAction` invokes a `CngxSelectCommitAction<T>`; stepper's
 * runner adapts a `CngxStepperCommitAction`); the controller has no
 * knowledge of the variant-specific action shape.
 *
 * @category interactive
 */
export type CngxCommitRunner<T> = (handlers: {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown) => void;
}) => CngxCommitHandle;

/**
 * Outcome handlers passed to `controller.begin(...)`. The controller
 * invokes exactly one of `onSuccess` / `onError` per commit lifecycle
 * (unless the commit is superseded, in which case neither fires).
 *
 * @category interactive
 */
export interface CngxCommitBeginHandlers<T> {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown, previous: T | undefined) => void;
}

/**
 * Encapsulated state machine for the async-commit lifecycle shared by
 * every cngx feature that has a "perform-an-async-write-then-update-
 * the-source-signal" flow (select family, stepper, future wizards).
 *
 * Owns:
 * - the `CngxAsyncState<T | undefined>` slot consumed by `CNGX_STATEFUL`
 *   bridges, commit-error templates, and the pending-row spinner;
 * - begin / cancel orchestration with monotonic supersede semantics;
 * - the "intended value" signal that drives the pending-spinner on
 *   the specific row / step the user just clicked.
 *
 * The controller is intentionally **not** an Angular service or
 * provider. It's a plain factory so it works in any injection context
 * (including outside Angular, for headless tests).
 *
 * @category interactive
 */
export interface CngxCommitController<T> {
  /** Read-only async-state view of the commit lifecycle. */
  readonly state: CngxAsyncState<T | undefined>;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean>;

  /**
   * The most recent intended value — what the user was trying to
   * commit. Used by the option-row spinner and the commit-error
   * template context to identify *which* option the failure belongs
   * to.
   */
  readonly intendedValue: Signal<T | undefined>;

  /**
   * Start a new commit. Supersedes any in-flight commit: the
   * previous runner's cancel handle fires synchronously, and the
   * previous outcome callbacks become no-ops if they fire late.
   *
   * @param runner   variant-specific action runner (closes over the
   *                 action and the intended value)
   * @param intended the value the user clicked
   * @param previous the value to roll back to on error
   * @param handlers success/error routes — the controller only
   *                 updates its own state and calls these; it does
   *                 NOT touch external value signals, panel open
   *                 state, or component outputs.
   */
  begin(
    runner: CngxCommitRunner<T>,
    intended: T | undefined,
    previous: T | undefined,
    handlers: CngxCommitBeginHandlers<T>,
  ): void;

  /**
   * Abort the currently in-flight commit without firing callbacks.
   * Use when the host component is destroyed or the commit-action
   * input changes mid-flight.
   */
  cancel(): void;
}

/**
 * Factory for the commit controller.
 *
 * Plain function, not a class — matches the rest of the repo
 * (`createManualState`, `createAsyncState`, `createTransitionTracker`).
 * See `reference_api_prefix_convention.md`.
 *
 * @category interactive
 */
export function createCommitController<T>(): CngxCommitController<T> {
  // Writable state slot — the `state` getter returns the read-only
  // `CngxAsyncState<T | undefined>` view so consumers can't bypass
  // the controller to flip status directly.
  const slot: ManualAsyncState<T | undefined> =
    createManualState<T | undefined>();

  // Monotonic commit id. Incremented on every `begin(...)`. An
  // outcome callback checks its captured id against the current
  // counter — if a newer commit has started, the callback is
  // ignored (supersede).
  let commitId = 0;

  // Cancel handle for the runner currently in flight. Replaced on
  // each `begin(...)` and cleared after the runner settles.
  let active: CngxCommitHandle | null = null;

  // Public signal: what the user was trying to commit. Exposed so
  // the template can render a pending spinner on THAT specific row
  // and the commit-error context can surface it.
  const intendedState = signal<T | undefined>(undefined);

  return {
    state: slot,
    isCommitting: computed(() => slot.isPending()),
    intendedValue: intendedState.asReadonly(),

    begin(runner, intended, previous, handlers) {
      // Supersede: tear down any previous runner. Must run BEFORE
      // we bump `commitId` — otherwise the previous callback's
      // supersede-check would pass and fire after all.
      active?.cancel();
      const id = ++commitId;
      intendedState.set(intended);
      slot.set('pending');

      active = runner({
        onSuccess: (committed) => {
          // Supersede guard. `commitId` advances on every new
          // `begin`; if our captured id is stale, a newer commit
          // has taken over.
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
      // Bump the id so any pending callbacks from the aborted
      // runner are treated as superseded and do nothing.
      commitId++;
    },
  };
}
