import { InjectionToken, untracked, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import { commitLedgerFor } from './internal/commit-ledger';
import type { CngxSelectCompareFn, CngxSelectCore } from './internal/select-core';

/**
 * Configuration for {@link createScalarCommitHandler}.
 */
export interface ScalarCommitHandlerOptions<T> {
  /** Primary scalar value signal. */
  readonly value: WritableSignal<T | undefined>;
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /** Source of `commitController`, `togglingOption`, `findOption`. */
  readonly core: CngxSelectCore<T, T>;
  readonly commitAction: Signal<CngxSelectCommitAction<T> | null>;
  /**
   * Fires after success and after `finalizeSelection`. Consumer emits
   * the change event. `option` is `null` when the final value isn't in
   * `flatOptions()` or on the clear path.
   */
  readonly onCommitFinalize: (
    option: CngxSelectOptionDef<T> | null,
    finalValue: T | undefined,
    previousValue: T | undefined,
  ) => void;
  /**
   * Fires after a clear commit succeeds with an empty result. Consumer
   * emits its clear events and announces the removal. When omitted, a
   * successful clear reaches `onCommitFinalize` with a `null` option.
   * A server that answers a clear with a value always reaches
   * `onCommitFinalize`.
   */
  readonly onClearFinalize?: (previousValue: T | undefined) => void;
  /**
   * Consumer routes through its commit-error announcer. `rolledBack` is
   * `true` when the previous value was restored before the call.
   */
  readonly onCommitError: (err: unknown, rolledBack?: boolean) => void;
  readonly onStateChange: (status: AsyncStatus) => void;
  readonly onError: (err: unknown) => void;
  /**
   * Mirror committed value into an `<input>` for input-trigger variants.
   * Fires on success and on rollback. Button-trigger variants omit this.
   */
  readonly onValueWrite?: (value: T | undefined) => void;
}

/**
 * API returned from {@link createScalarCommitHandler}.
 */
export interface ScalarCommitHandler<T> {
  /**
   * Start a commit. Consumer pre-writes optimistic `value.set(intended)`
   * + `togglingOption.set(option)`; handler drives the state machine.
   */
  beginCommit(intended: T, previous: T | undefined, action: CngxSelectCommitAction<T>): void;
  /**
   * Dispatch a commit from AD activation. No-op when `commitAction` is
   * unbound - wire the `onActivate` path to `finalizeSelection` in that
   * case.
   */
  dispatchFromActivation(intended: T, option: CngxSelectOptionDef<T>): void;
  /**
   * Start a clear commit: the bound action receives `undefined`. In
   * optimistic mode the handler empties `value` first; a pending commit is
   * superseded and rolls back to the confirmed value on failure. Retry
   * replays the clear. The composites route every clear with a bound
   * `commitAction` here.
   */
  beginClear(previous: T | undefined, action: CngxSelectCommitAction<T>): void;
  /** Non-commit finalization. */
  finalizeSelection(
    intended: T,
    option: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
  ): void;
  /**
   * Replay last commit. In optimistic mode the intended value is written
   * back first, so the trigger shows it while pending. No-op when
   * preconditions unmet.
   */
  retryLast(): void;
}

/**
 * Scalar-shape commit flow shared by scalar select variants. Owns
 * commit-controller lifecycle, reconciliation, `togglingOption.set(null)`
 * on success, optimistic rollback on error. Consumer owns change-event
 * emission, announcer severity (`onCommitError`), input-text mirroring
 * (`onValueWrite`), and popover-close timing - handler never closes the
 * panel.
 */
export function createScalarCommitHandler<T>(
  opts: ScalarCommitHandlerOptions<T>,
): ScalarCommitHandler<T> {
  const ledger = commitLedgerFor<T, T>(opts.core.commitController);
  const togglingOption = opts.core.togglingOption;

  const same = (a: T | undefined, b: T | undefined): boolean =>
    (opts.compareWith() as CngxSelectCompareFn<unknown>)(a, b);

  const mirrorWrite = (value: T | undefined): void => {
    opts.onValueWrite?.(value);
  };

  const finalizeSelection = (
    intended: T,
    option: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
  ): void => {
    opts.value.set(intended);
    mirrorWrite(intended);
    opts.onCommitFinalize(option, intended, previousValue);
  };

  const beginCommit = (
    intended: T,
    previous: T | undefined,
    action: CngxSelectCommitAction<T>,
  ): void => {
    const option = untracked(togglingOption);
    ledger.beginScalar<T | undefined>({
      kind: 'select',
      next: intended,
      previous,
      option,
      action,
      commitAction: opts.commitAction,
      value: opts.value,
      same,
      commitMode: opts.commitMode,
      onStateChange: opts.onStateChange,
      onReplay: () => {
        togglingOption.set(option);
        if (opts.commitMode() === 'optimistic') {
          // Show the intended value again while the replay is pending.
          mirrorWrite(intended);
        }
      },
      onSuccess: (finalValue, confirmedPrevious) => {
        togglingOption.set(null);
        mirrorWrite(finalValue);
        // finalValue may be undefined - controller return type allows it.
        // Action-select treats null as skip via discriminant; scalar
        // select gets "cleared" semantics for free.
        const opt = finalValue === undefined ? null : opts.core.findOption(finalValue);
        opts.onCommitFinalize(opt, finalValue, confirmedPrevious);
      },
      onError: opts.onError,
      onRollback: mirrorWrite,
      announceError: opts.onCommitError,
    });
  };

  const beginClear = (previous: T | undefined, action: CngxSelectCommitAction<T>): void => {
    // A clear is option-less; a stale marker would spin the wrong row.
    togglingOption.set(null);
    if (opts.commitMode() === 'optimistic') {
      opts.value.set(undefined);
      mirrorWrite(undefined);
    }
    ledger.beginScalar<T | undefined>({
      kind: 'clear',
      next: undefined,
      previous,
      option: null,
      action,
      commitAction: opts.commitAction,
      value: opts.value,
      same,
      commitMode: opts.commitMode,
      onStateChange: opts.onStateChange,
      onReplay: () => {
        togglingOption.set(null);
        if (opts.commitMode() === 'optimistic') {
          mirrorWrite(undefined);
        }
      },
      onSuccess: (finalValue, confirmedPrevious) => {
        togglingOption.set(null);
        mirrorWrite(finalValue);
        if (finalValue === undefined && opts.onClearFinalize) {
          opts.onClearFinalize(confirmedPrevious);
          return;
        }
        const opt = finalValue === undefined ? null : opts.core.findOption(finalValue);
        opts.onCommitFinalize(opt, finalValue, confirmedPrevious);
      },
      onError: opts.onError,
      onRollback: mirrorWrite,
      announceError: opts.onCommitError,
    });
  };

  const dispatchFromActivation = (intended: T, option: CngxSelectOptionDef<T>): void => {
    const previous = opts.value();
    togglingOption.set(option);
    if (opts.commitMode() === 'optimistic') {
      opts.value.set(intended);
    }
    const action = opts.commitAction();
    if (!action) {
      // No action bound - AD dispatcher fires `onActivate` and the
      // consumer's `finalizeSelection` handles the write.
      return;
    }
    beginCommit(intended, previous, action);
  };

  const retryLast = (): void => ledger.retry();

  return { beginCommit, beginClear, dispatchFromActivation, finalizeSelection, retryLast };
}

/**
 * Clear path shared by the scalar composites. With a bound `commitAction`
 * the clear goes through `handler.beginClear`, so the server sees it and a
 * pending commit cannot undo it. Without one, any pending commit is
 * cancelled and its state settled (a stale error and Retry must not
 * survive the clear) before `clearLocally` writes the empty value.
 *
 * @internal
 */
export function dispatchScalarClear<T>(opts: {
  readonly core: CngxSelectCore<T, T>;
  readonly handler: ScalarCommitHandler<T>;
  readonly commitAction: Signal<CngxSelectCommitAction<T> | null>;
  readonly previous: T | undefined;
  readonly clearLocally: () => void;
}): void {
  const action = untracked(opts.commitAction);
  if (action) {
    opts.handler.beginClear(opts.previous, action);
    return;
  }
  opts.core.commitController.cancel({ settle: true });
  opts.core.togglingOption.set(null);
  opts.clearLocally();
}

/**
 * Factory signature for {@link CNGX_SCALAR_COMMIT_HANDLER_FACTORY}.
 */
export type CngxScalarCommitHandlerFactory = <T>(
  opts: ScalarCommitHandlerOptions<T>,
) => ScalarCommitHandler<T>;

/**
 * Factory for the scalar commit handler - value reconciliation and finalize
 * orchestration for single-value selects, the scalar twin of
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`. Default `createScalarCommitHandler`.
 * Override to change how an optimistic selection reconciles against an async
 * commit result.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/scalar-commit-handler.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CNGX_SELECT_COMMIT_CONTROLLER_FACTORY, CNGX_ARRAY_COMMIT_HANDLER_FACTORY
 */
export const CNGX_SCALAR_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxScalarCommitHandlerFactory>('CngxScalarCommitHandlerFactory', {
    providedIn: 'root',
    factory: () => createScalarCommitHandler,
  });
