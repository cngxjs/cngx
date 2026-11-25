import { computed, signal, type Signal } from '@angular/core';

import { createManualState, type ManualAsyncState } from '../async-state';
import { CNGX_DEV_DESCRIPTORS, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Cancel handle returned by a {@link CngxCommitRunner}. The controller
 * stores it on every `begin(...)` and calls `cancel()` synchronously
 * when a newer commit supersedes it. Action runtimes (RxJS subscription
 * teardown, AbortController abort, plain flag) implement the handle
 * however they need.
 */
export interface CngxCommitHandle {
  readonly cancel: () => void;
}

/**
 * Action runner contract. Receives the controller's success / error /
 * refused routes and returns a cancel handle. The runner is opaque to the
 * controller - it can wrap any async source (Observable, Promise,
 * sync value) and any cancellation primitive.
 *
 * Variants supply their own runner adapter (e.g. select's
 * `runCommitAction` invokes a `CngxSelectCommitAction<T>`; stepper's
 * runner adapts a `CngxStepperCommitAction`); the controller has no
 * knowledge of the variant-specific action shape.
 *
 * `onRefused` is for an action that declined on purpose (a `false`
 * answer): nothing changed, so the controller stores no error. A runner
 * whose action shape has no refusal (the select family) never calls it.
 */
export type CngxCommitRunner<T> = (handlers: {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown) => void;
  readonly onRefused: () => void;
}) => CngxCommitHandle;

/**
 * Outcome handlers passed to `controller.begin(...)`. The controller
 * invokes exactly one of `onSuccess` / `onError` / `onRefused` per
 * commit lifecycle (unless the commit is superseded, in which case none
 * fires). `onRefused` is optional because only families whose action can
 * refuse (the stepper) route it; when it is omitted a refusal still
 * settles the state slot.
 */
export interface CngxCommitBeginHandlers<T> {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown, previous: T | undefined) => void;
  readonly onRefused?: (previous: T | undefined) => void;
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
 * Three outcomes settle a commit. Success stores the committed value.
 * Failure stores the error (`'error'`). A refusal - the action answered
 * `false` - goes back to `'idle'` through `setIdle()`: the error and the
 * intended value are cleared, while `data`, `lastUpdated` and
 * `isFirstLoad()` keep what the last success left, because a refusal
 * changed nothing. A custom controller (`CNGX_COMMIT_CONTROLLER_FACTORY`)
 * must hand the runner an `onRefused` route and forward it to
 * `handlers.onRefused`.
 *
 * The controller is intentionally **not** an Angular service or
 * provider. It's a plain factory so it works in any injection context
 * (including outside Angular, for headless tests).
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
   * At most one outcome fires per call: after the runner's first
   * `onSuccess` / `onError` / `onRefused` (or its synchronous throw),
   * every further route call of that runner is ignored.
   *
   * A runner that throws synchronously before any outcome settles the
   * commit as `'error'` with the thrown value and calls
   * `handlers.onError`; `begin()` does not throw. A throw after the
   * runner already settled is rethrown unchanged.
   *
   * @param runner   variant-specific action runner (closes over the
   *                 action and the intended value)
   * @param intended the value the user clicked
   * @param previous the value to roll back to on error or refusal
   * @param handlers success/error/refused routes - the controller only
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
   * pending commit must not leave `busy` latched true forever. It
   * resets the slot: `'idle'` with data, error, progress and
   * `lastUpdated` cleared and `isFirstLoad()` true again, and it
   * clears `intendedValue`.
   */
  cancel(options?: { readonly settle?: boolean }): void;
}

/**
 * Factory for the commit controller.
 *
 * Plain function, not a class - matches the rest of the repo
 * (`createManualState`, `createAsyncState`, `createTransitionTracker`).
 * <example-url>/#/common/data/commit-controller/begin-supersede-cancel</example-url>
 */
export function createCommitController<T>(): CngxCommitController<T> {
  const slot: ManualAsyncState<T | undefined> = createManualState<T | undefined>();

  // Read-only `state` view: the slot's signals without its write methods, so
  // consumers can't flip status directly.
  const state: CngxAsyncState<T | undefined> = {
    status: slot.status,
    data: slot.data,
    error: slot.error,
    progress: slot.progress,
    isLoading: slot.isLoading,
    isPending: slot.isPending,
    isRefreshing: slot.isRefreshing,
    isBusy: slot.isBusy,
    isFirstLoad: slot.isFirstLoad,
    isEmpty: slot.isEmpty,
    hasData: slot.hasData,
    isSettled: slot.isSettled,
    lastUpdated: slot.lastUpdated,
  };
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    // The view hides the slot; listing it here is how an inspector reaches
    // the slot's own descriptor.
    CNGX_DEV_DESCRIPTORS.tag(state, {
      kind: 'cngx-dev:factory',
      factory: 'createCommitController',
      inputs: { state: slot },
    });
  }

  // monotonic supersede id; stale callbacks compare captured id against this
  let commitId = 0;

  let active: CngxCommitHandle | null = null;

  // drives the pending spinner on the specific row the user clicked
  const intendedState = signal<T | undefined>(undefined);

  return {
    state,
    isCommitting: computed(
      () => slot.isPending(),
      typeof ngDevMode !== 'undefined' && ngDevMode
        ? { debugName: 'commitController.isCommitting' }
        : undefined,
    ),
    intendedValue: intendedState.asReadonly(),

    begin(runner, intended, previous, handlers) {
      // bump commitId BEFORE tearing down the previous runner: a runner that
      // cancels synchronously would otherwise still pass the supersede check
      // and fire its callbacks after all
      const id = ++commitId;
      active?.cancel();
      active = null;
      intendedState.set(intended);
      slot.set('pending');

      // A runner may settle synchronously, i.e. before its handle is even
      // returned. The settled flag keeps such a finished handle out of
      // `active`, so a later begin()/cancel() never calls cancel() on a
      // completed runner (CngxCommitHandle does not require idempotence).
      // It is also the once-guard: after the first outcome every further
      // route call of this runner is ignored.
      let settled = false;
      let handle: CngxCommitHandle;
      try {
        handle = runner({
          onSuccess: (committed) => {
            if (id !== commitId || settled) {
              return;
            }
            settled = true;
            slot.setSuccess(committed);
            active = null;
            handlers.onSuccess(committed);
          },
          onError: (err) => {
            if (id !== commitId || settled) {
              return;
            }
            settled = true;
            slot.setError(err);
            active = null;
            handlers.onError(err, previous);
          },
          onRefused: () => {
            if (id !== commitId || settled) {
              return;
            }
            settled = true;
            slot.setIdle();
            intendedState.set(undefined);
            active = null;
            handlers.onRefused?.(previous);
          },
        });
      } catch (err: unknown) {
        // A throw after the runner already settled is the runner's own bug:
        // rethrow it unchanged. A throw before any outcome is the outcome.
        if (settled) {
          throw err;
        }
        if (id === commitId) {
          settled = true;
          slot.setError(err);
          handlers.onError(err, previous);
        }
        return;
      }
      if (settled) {
        // Settled during the call: `active` is already cleared, or holds the
        // handle of a begin() that an outcome handler started.
        return;
      }
      if (id !== commitId) {
        // Superseded during its own call, before its handle existed for the
        // newer begin()/cancel() to tear down.
        handle.cancel();
        return;
      }
      active = handle;
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
