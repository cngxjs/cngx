import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import { sameArrayContents } from './internal/compare';
import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './internal/select-core';

/**
 * Configuration for {@link createArrayCommitHandler}.
 *
 * @category forms/select/commit
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
}

/**
 * API returned from {@link createArrayCommitHandler}.
 *
 * @category forms/select/commit
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
   * Replay the last commit. Routes to `beginToggle`/`beginClear` based on
   * `togglingOption()`. No-op when preconditions are unmet.
   */
  retryLast(): void;
}

/**
 * Array-shape commit flow shared by `CngxMultiSelect` and `CngxCombobox`.
 * Owns commit-controller lifecycle, reconciliation via
 * {@link sameArrayContents}, `togglingOption.set(null)` on success,
 * optimistic rollback on error, live-region "removed" announce. Consumer
 * owns change-event payloads via the finalize callbacks.
 *
 * No scalar twin: this handler is array-only by design.
 *
 * @category forms/select/commit
 */
export function createArrayCommitHandler<T>(
  opts: ArrayCommitHandlerOptions<T>,
): ArrayCommitHandler<T> {
  const commitController = opts.core.commitController;
  const togglingOption = opts.core.togglingOption;

  const reconcileValues = (target: readonly T[]): void => {
    if (!sameArrayContents(opts.values(), target, opts.compareWith())) {
      opts.values.set([...target]);
    }
  };

  const rollbackIfOptimistic = (rollbackTo: T[] | undefined): void => {
    if (opts.commitMode() !== 'optimistic') {
      return;
    }
    reconcileValues(rollbackTo ?? []);
  };

  const announceOnError = (): void => {
    opts.core.announce(null, 'removed', opts.values().length, true);
  };

  const beginToggle = (
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void => {
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
        rollbackIfOptimistic(rollbackTo);
        announceOnError();
      },
    });
  };

  const beginClear = (previous: T[], action: CngxSelectCommitAction<T[]>): void => {
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
        rollbackIfOptimistic(rollbackTo);
        announceOnError();
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
    const opt = togglingOption();
    if (opt === null) {
      beginClear(last, action);
      return;
    }
    beginToggle(intendedNext, last, opt, action);
  };

  return { beginToggle, beginClear, retryLast };
}

/**
 * Factory signature for {@link CNGX_ARRAY_COMMIT_HANDLER_FACTORY}.
 *
 * @category forms/select/commit
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
 * @category forms/select/commit
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
