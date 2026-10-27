import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import { sameArrayContents } from './internal/compare';
import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './internal/select-core';

/**
 * Configuration for {@link createArrayCommitHandler}.
 */
export interface ArrayCommitHandlerOptions<T> {
  /** Component's primary value signal (multi-select / combobox). */
  readonly values: WritableSignal<T[]>;
  /** Element-wise equality for value reconciliation. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /** Source of `commitController`, `togglingOption`, `announce`. */
  readonly core: CngxSelectCore<T, T[]>;
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /**
   * Last committed snapshot. Consumer updates it before each `beginToggle`/
   * `beginClear` so `retryLast` replays against the correct rollback target.
   */
  readonly getLastCommitted: () => T[];
  /** Consumer emits `selectionChange`/`optionToggled` and announces. */
  readonly onToggleFinalize: (option: CngxSelectOptionDef<T>, isNowSelected: boolean) => void;
  /** Consumer emits `cleared` + `selectionChange(action:'clear')`. */
  readonly onClearFinalize: (previous: T[], finalValues: T[]) => void;
  readonly onStateChange: (status: AsyncStatus) => void;
  readonly onError: (err: unknown) => void;
  /**
   * Announce a failed commit to AT. Wire this to the commit-error
   * announcer (`CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`) so the live region
   * carries real error content. When omitted the handler announces
   * nothing on error - the visual error surface and `onError` still
   * fire; it never falls back to the misleading "selection cleared"
   * phrase.
   */
  readonly announceError?: (err: unknown) => void;
}

/**
 * API returned from {@link createArrayCommitHandler}.
 */
export interface ArrayCommitHandler<T> {
  /**
   * Start a toggle commit. Consumer must perform the optimistic write +
   * `togglingOption.set(option)` first; the handler drives the commit-
   * controller lifecycle, reconciliation, and finalize dispatch.
   */
  beginToggle(
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void;
  /** Same split as {@link beginToggle} - consumer pre-writes `values`. */
  beginClear(previous: T[], action: CngxSelectCommitAction<T[]>): void;
  /**
   * Replay the last commit. Routes by the kind of the last commit this
   * handler started: a clear replays `beginClear`, a toggle replays
   * `beginToggle` with `togglingOption()` and is a no-op when that marker
   * was reset (never a clear). In optimistic mode the intended array is
   * written back before the replay, so the trigger shows it while pending.
   * No-op when preconditions are unmet.
   */
  retryLast(): void;
}

/**
 * Array-shape commit flow shared by `CngxMultiSelect` and `CngxCombobox`.
 * Owns commit-controller lifecycle, reconciliation via
 * {@link sameArrayContents}, `togglingOption.set(null)` on success and at
 * `beginClear` entry, optimistic rollback on error, live-region "removed"
 * announce on a successful clear and the `announceError` hook on failure.
 * Consumer owns change-event payloads via the finalize callbacks.
 *
 * No scalar twin: this handler is array-only by design.
 */
export function createArrayCommitHandler<T>(
  opts: ArrayCommitHandlerOptions<T>,
): ArrayCommitHandler<T> {
  const commitController = opts.core.commitController;
  const togglingOption = opts.core.togglingOption;
  // Kind of the last commit started here; `retryLast` routes by it.
  let lastKind: 'toggle' | 'clear' | null = null;

  const reconcileValues = (target: readonly T[]): void => {
    if (!sameArrayContents(opts.values(), target, opts.compareWith())) {
      opts.values.set([...target]);
    }
  };

  // An external write during the pending window wins over the stale
  // rollback snapshot: roll back only while the model still holds the
  // optimistic array this commit wrote.
  const rollbackIfOptimistic = (rollbackTo: T[] | undefined, intended: readonly T[]): void => {
    if (opts.commitMode() !== 'optimistic') {
      return;
    }
    if (!sameArrayContents(opts.values(), intended, opts.compareWith())) {
      return;
    }
    reconcileValues(rollbackTo ?? []);
  };

  const reapplyIfOptimistic = (intended: readonly T[]): void => {
    if (opts.commitMode() !== 'optimistic') {
      return;
    }
    reconcileValues(intended);
  };

  const announceOnError = (err: unknown): void => {
    // Never the old announce(null, 'removed', ...) fallback: with a null
    // option the default formatter reads "selection cleared" - announcing a
    // FAILED commit as a successful clear.
    opts.announceError?.(err);
  };

  const beginToggle = (
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void => {
    lastKind = 'toggle';
    opts.onStateChange('pending');
    commitController.begin(action, next, previous, {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        const finalValues: T[] = committed ?? next;
        reconcileValues(finalValues);
        const eq = opts.compareWith();
        const isNowSelected = finalValues.some((v) => eq(v, option.value));
        togglingOption.set(null);
        opts.onToggleFinalize(option, isNowSelected);
      },
      onError: (err, rollbackTo) => {
        opts.onStateChange('error');
        opts.onError(err);
        rollbackIfOptimistic(rollbackTo, next);
        announceOnError(err);
      },
    });
  };

  const beginClear = (previous: T[], action: CngxSelectCommitAction<T[]>): void => {
    // Enforce the retryLast disambiguation contract here instead of relying
    // on call-site discipline: a clear is by definition option-less.
    togglingOption.set(null);
    lastKind = 'clear';
    opts.onStateChange('pending');
    commitController.begin(action, [], previous, {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        const finalValues: T[] = committed ?? [];
        reconcileValues(finalValues);
        togglingOption.set(null);
        opts.onClearFinalize(previous, finalValues);
        opts.core.announce(null, 'removed', finalValues.length, true);
      },
      onError: (err, rollbackTo) => {
        opts.onStateChange('error');
        opts.onError(err);
        rollbackIfOptimistic(rollbackTo, []);
        announceOnError(err);
      },
    });
  };

  const retryLast = (): void => {
    const intendedNext = commitController.intendedValue();
    const action = opts.commitAction();
    if (!action || intendedNext === undefined) {
      return;
    }
    const last = opts.getLastCommitted();
    if (lastKind === 'clear') {
      reapplyIfOptimistic([]);
      beginClear(last, action);
      return;
    }
    const opt = togglingOption();
    if (lastKind !== 'toggle' || opt === null) {
      return;
    }
    reapplyIfOptimistic(intendedNext);
    beginToggle(intendedNext, last, opt, action);
  };

  return { beginToggle, beginClear, retryLast };
}

/**
 * Factory signature for {@link CNGX_ARRAY_COMMIT_HANDLER_FACTORY}.
 */
export type CngxArrayCommitHandlerFactory = <T>(
  opts: ArrayCommitHandlerOptions<T>,
) => ArrayCommitHandler<T>;

/**
 * Factory for the array commit handler - value reconciliation and finalize
 * orchestration for multi-value selects, one layer above
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` on top of the state machine. Default
 * `createArrayCommitHandler`. Override to change how optimistic adds / removes
 * reconcile against an async commit result.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/array-commit-handler.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CNGX_SELECT_COMMIT_CONTROLLER_FACTORY, CNGX_CHIP_REMOVAL_HANDLER_FACTORY
 */
export const CNGX_ARRAY_COMMIT_HANDLER_FACTORY = new InjectionToken<CngxArrayCommitHandlerFactory>(
  'CngxArrayCommitHandlerFactory',
  {
    providedIn: 'root',
    factory: () => createArrayCommitHandler,
  },
);
