import { InjectionToken, untracked, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

/**
 * Configuration for {@link createScalarCommitHandler}.
 *
 * @category forms/select/commit
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
  /** Consumer routes through its commit-error announcer. */
  readonly onCommitError: (err: unknown) => void;
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
 *
 * @category forms/select/commit
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
  /** Non-commit finalization. */
  finalizeSelection(
    intended: T,
    option: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
  ): void;
  /** Replay last commit. No-op when preconditions unmet. */
  retryLast(): void;
}

/**
 * Scalar-shape commit flow shared by scalar select variants. Owns
 * commit-controller lifecycle, reconciliation, `togglingOption.set(null)`
 * on success, optimistic rollback on error. Consumer owns change-event
 * emission, announcer severity (`onCommitError`), input-text mirroring
 * (`onValueWrite`), and popover-close timing - handler never closes the
 * panel.
 *
 * @category forms/select/commit
 */
export function createScalarCommitHandler<T>(
  opts: ScalarCommitHandlerOptions<T>,
): ScalarCommitHandler<T> {
  const commitController = opts.core.commitController;
  const togglingOption = opts.core.togglingOption;

  // Rollback target. Seeded under `untracked` so the initial read isn't
  // a reactive dep; refreshed on every commit dispatch.
  let lastCommitted: T | undefined = untracked(() => opts.value());

  const reconcileValue = (target: T | undefined): void => {
    const eq = opts.compareWith() as CngxSelectCompareFn<unknown>;
    if (!eq(opts.value(), target)) {
      opts.value.set(target);
    }
  };

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
    lastCommitted = previous;
    opts.onStateChange('pending');
    const mode = opts.commitMode();
    commitController.begin(action, intended, previous, {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        const finalValue = committed ?? intended;
        reconcileValue(finalValue);
        togglingOption.set(null);
        mirrorWrite(finalValue);
        // finalValue may be undefined - controller return type allows it.
        // Action-select treats null as skip via discriminant; scalar
        // select gets "cleared" semantics for free.
        const opt = finalValue === undefined ? null : opts.core.findOption(finalValue);
        opts.onCommitFinalize(opt, finalValue, previous);
      },
      onError: (err, rollbackTo) => {
        opts.onStateChange('error');
        opts.onError(err);
        if (mode === 'optimistic') {
          const rollback = (rollbackTo ?? undefined) as T | undefined;
          reconcileValue(rollback);
          mirrorWrite(rollback);
        }
        opts.onCommitError(err);
      },
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
      // consumer's `finalizeSelection` handles the write. Track
      // lastCommitted anyway so a later retry can replay.
      lastCommitted = previous;
      return;
    }
    beginCommit(intended, previous, action);
  };

  const retryLast = (): void => {
    const intendedNext = commitController.intendedValue();
    const action = opts.commitAction();
    if (!action || intendedNext === undefined) {
      return;
    }
    beginCommit(intendedNext as T, lastCommitted, action);
  };

  return { beginCommit, dispatchFromActivation, finalizeSelection, retryLast };
}

/**
 * Factory signature for {@link CNGX_SCALAR_COMMIT_HANDLER_FACTORY}.
 *
 * @category forms/select/commit
 */
export type CngxScalarCommitHandlerFactory = <T>(
  opts: ScalarCommitHandlerOptions<T>,
) => ScalarCommitHandler<T>;

/**
 * Factory token for {@link ScalarCommitHandler}. Default
 * {@link createScalarCommitHandler}.
 *
 * @category forms/select/commit
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/scalar-commit-handler.ts
 * @since 0.1.0
 */
export const CNGX_SCALAR_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxScalarCommitHandlerFactory>('CngxScalarCommitHandlerFactory', {
    providedIn: 'root',
    factory: () => createScalarCommitHandler,
  });
