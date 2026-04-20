import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import { sameArrayContents } from './compare';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

/**
 * Configuration for {@link createArrayCommitHandler}.
 *
 * @category interactive
 */
export interface ArrayCommitHandlerOptions<T> {
  /** Component's primary value signal (multi-select / combobox). */
  readonly values: WritableSignal<T[]>;
  /** Element-wise equality used for value reconciliation. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /** Optimistic vs pessimistic commit UX. */
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /**
   * Select-core handle — factory reads `commitController`, `togglingOption`,
   * and `announce` from it. Keeps the factory value-shape-agnostic beyond
   * the `T[]` commitment.
   */
  readonly core: CngxSelectCore<T, T[]>;
  /** Current commit action. Used by `retryLast` to replay. */
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /**
   * Last successfully committed snapshot. Consumer owns this field and
   * updates it *before* invoking `beginToggle`/`beginClear` so `retryLast`
   * can replay against the correct rollback target.
   */
  readonly getLastCommitted: () => T[];
  /** Called after a successful toggle commit — consumer emits `selectionChange`/`optionToggled`/announces. */
  readonly onToggleFinalize: (option: CngxSelectOptionDef<T>, isNowSelected: boolean) => void;
  /** Called after a successful clear-all commit — consumer emits `cleared` + `selectionChange(action:'clear')`. */
  readonly onClearFinalize: (previous: T[], finalValues: T[]) => void;
  /** State-transition hook for consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Error-forward hook for consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
}

/**
 * API returned from {@link createArrayCommitHandler}.
 *
 * @category interactive
 */
export interface ArrayCommitHandler<T> {
  /**
   * Start a toggle commit. Consumer is responsible for the optimistic
   * write + `togglingOption.set(option)` *before* calling this — the
   * handler only drives the commit-controller lifecycle, success/error
   * reconciliation, and finalize-callback dispatch.
   */
  beginToggle(
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void;
  /**
   * Start a clear-all commit. Same responsibility split as
   * {@link beginToggle} — consumer already wrote `values.set([])` if
   * optimistic and `togglingOption.set(null)`.
   */
  beginClear(previous: T[], action: CngxSelectCommitAction<T[]>): void;
  /**
   * Replay the last failed commit. Reads `commitController.intendedValue()`
   * + `togglingOption()` + `commitAction()` + `getLastCommitted()` to
   * decide between `beginToggle` and `beginClear`. No-op when
   * preconditions are unmet (no action, nothing intended).
   */
  retryLast(): void;
}

/**
 * Factory for the array-shape commit flow shared by `CngxMultiSelect` and
 * `CngxCombobox`. Absorbs the bit-identical `beginCommit` +
 * `beginCommitClear` + `retryCommit` triad those variants previously
 * carried inline (~130 LOC of duplicate code across the two files).
 *
 * **Responsibility split.** The handler owns the commit-controller
 * lifecycle (pending/success/error emits, value reconciliation via
 * {@link sameArrayContents}, `togglingOption.set(null)` on success,
 * rollback on error in optimistic mode, live-region "removed" announce
 * on error/clear paths). The consumer owns value-shape emissions
 * (`selectionChange`, `optionToggled`, `cleared`) via the finalize
 * callbacks — this keeps the family's three distinct change-event
 * payloads (`CngxMultiSelectChange`, `CngxComboboxChange`, and future
 * shapes) out of shared code.
 *
 * Analysis note: a scalar twin (`createScalarCommitHandler` for
 * `CngxSelect`/`CngxTypeahead`) was considered and rejected — those two
 * variants diverge semantically (popover-close timing, announcer
 * severity, `display.writeFromValue` integration). Extracting a scalar
 * factory would require harmonising behaviour (= breaking change) or
 * degenerate into a dozen optional callbacks with no LOC win.
 *
 * @category interactive
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
 * Factory-signature type — mirrors {@link createArrayCommitHandler} so
 * DI-overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxArrayCommitHandlerFactory = <T>(
  opts: ArrayCommitHandlerOptions<T>,
) => ArrayCommitHandler<T>;

/**
 * DI token resolving the factory used to instantiate an
 * {@link ArrayCommitHandler}. Defaults to {@link createArrayCommitHandler};
 * override app-wide via `providers: [{ provide: CNGX_ARRAY_COMMIT_HANDLER_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to wrap the default with retry-
 * with-backoff, offline-queue, audit-logging or telemetry without
 * forking any select-family component.
 *
 * Symmetrical to `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` but one layer
 * higher (that token controls the low-level state-machine;
 * this token controls the value-reconciliation + finalize orchestration
 * on top).
 *
 * @category interactive
 */
export const CNGX_ARRAY_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxArrayCommitHandlerFactory>(
    'CngxArrayCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createArrayCommitHandler,
    },
  );
