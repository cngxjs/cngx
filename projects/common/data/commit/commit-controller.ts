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
 * @category common/data/commit
 */
export interface CngxCommitHandle {
  readonly cancel: () => void;
}

/**
 * Action runner contract. Receives the controller's success/error
 * routes and returns a cancel handle. The runner is opaque to the
 * controller - it can wrap any async source (Observable, Promise,
 * sync value) and any cancellation primitive.
 *
 * Variants supply their own runner adapter (e.g. select's
 * `runCommitAction` invokes a `CngxSelectCommitAction<T>`; stepper's
 * runner adapts a `CngxStepperCommitAction`); the controller has no
 * knowledge of the variant-specific action shape.
 *
 * @category common/data/commit
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
 * @category common/data/commit
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
 * @category common/data/commit
 */
export interface CngxCommitController<T> {
  /** Read-only async-state view of the commit lifecycle. */
  readonly state: CngxAsyncState<T | undefined>;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean>;

  /**
   * The most recent intended value - what the user was trying to
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
   * @param handlers success/error routes - the controller only
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
   *
   * By default the state slot keeps its current status (a destroyed
   * host never reads it again). Pass `settle: true` when the surface
   * lives on - an explicit back-navigation or reset that supersedes a
   * pending commit must return `state` to `'idle'`, or `busy` latches
   * true forever.
   */
  cancel(options?: { readonly settle?: boolean }): void;
}

/**
 * Factory for the commit controller.
 *
 * Plain function, not a class - matches the rest of the repo
 * (`createManualState`, `createAsyncState`, `createTransitionTracker`).
 * See `reference_api_prefix_convention.md`.
 *
 * @category common/data/commit
 */
export function createCommitController<T>(): CngxCommitController<T> {
  // read-only `state` view; consumers can't flip status directly
  const slot: ManualAsyncState<T | undefined> =
    createManualState<T | undefined>();

  // monotonic supersede id; stale callbacks compare captured id against this
  let commitId = 0;

  let active: CngxCommitHandle | null = null;

  // drives the pending spinner on the specific row the user clicked
  const intendedState = signal<T | undefined>(undefined);

  return {
    state: slot,
    isCommitting: computed(() => slot.isPending()),
    intendedValue: intendedState.asReadonly(),

    begin(runner, intended, previous, handlers) {
      // bump commitId BEFORE tearing down the previous runner: a runner that
      // cancels synchronously would otherwise still pass the supersede check
      // and fire its callbacks after all
      const id = ++commitId;
      active?.cancel();
      intendedState.set(intended);
      slot.set('pending');

      // A runner may settle synchronously, i.e. before its handle is even
      // returned. The settled flag keeps such a finished handle out of
      // `active`, so a later begin()/cancel() never calls cancel() on a
      // completed runner (CngxCommitHandle does not require idempotence).
      let settled = false;
      const handle = runner({
        onSuccess: (committed) => {
          if (id !== commitId) {
            return;
          }
          settled = true;
          slot.setSuccess(committed);
          active = null;
          handlers.onSuccess(committed);
        },
        onError: (err) => {
          if (id !== commitId) {
            return;
          }
          settled = true;
          slot.setError(err);
          active = null;
          handlers.onError(err, previous);
        },
      });
      active = settled ? null : handle;
    },

    cancel(options?: { readonly settle?: boolean }) {
      // bump first: callbacks of a synchronously-cancelling runner must
      // already see themselves superseded
      commitId++;
      active?.cancel();
      active = null;
      if (options?.settle) {
        // Full settle: idle status plus cleared data/error, so a stale
        // rejection cannot resurface on the next commit window.
        slot.reset();
        intendedState.set(undefined);
      }
    },
  };
}
