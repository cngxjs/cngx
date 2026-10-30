import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import { commitLedgerFor } from './internal/commit-ledger';
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
   * phrase. `rolledBack` is `true` when the previous selection was restored
   * before the call.
   */
  readonly announceError?: (err: unknown, rolledBack?: boolean) => void;
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
   * Replay the last failed commit this handler started (the commit-error
   * Retry): a clear replays the clear, a toggle the toggle with its own
   * option. In optimistic mode the intended array is written back before the
   * replay, so the trigger shows it while pending. A composite with a second
   * commit source routes Retry here only when this handler started the last
   * commit. No-op once that commit succeeded or without a bound
   * `commitAction`.
   */
  retryLast(): void;
}

/**
 * Array-shape commit flow shared by the multi-value selects. A thin adapter
 * over the internal commit ledger, which owns the controller lifecycle,
 * reconciliation via {@link sameArrayContents}, the optimistic rollback and
 * the retry routing. The handler adds `togglingOption.set(null)` on success
 * and at `beginClear` entry, the live-region "removed" announce on a
 * successful clear and the `announceError` hook on failure. Consumer owns
 * change-event payloads via the finalize callbacks.
 *
 * No scalar twin: this handler is array-only by design.
 */
export function createArrayCommitHandler<T>(
  opts: ArrayCommitHandlerOptions<T>,
): ArrayCommitHandler<T> {
  const ledger = commitLedgerFor<T[], T>(opts.core.commitController);
  const togglingOption = opts.core.togglingOption;

  const same = (a: readonly T[], b: readonly T[]): boolean =>
    sameArrayContents(a, b, opts.compareWith());

  const shared = {
    commitAction: opts.commitAction,
    value: opts.values,
    same,
    copy: (v: T[]): T[] => [...v],
    commitMode: opts.commitMode,
    onStateChange: opts.onStateChange,
    onError: opts.onError,
    // Never the old announce(null, 'removed', ...) fallback: with a null
    // option the default formatter reads "selection cleared" - announcing a
    // FAILED commit as a successful clear.
    announceError: opts.announceError,
  };

  const beginToggle = (
    next: T[],
    previous: T[],
    option: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void => {
    ledger.beginMembers<T[]>({
      ...shared,
      kind: 'toggle',
      next,
      previous,
      option,
      action,
      onReplay: () => togglingOption.set(option),
      onSuccess: (finalValues) => {
        const eq = opts.compareWith();
        const isNowSelected = finalValues.some((v) => eq(v, option.value));
        togglingOption.set(null);
        opts.onToggleFinalize(option, isNowSelected);
      },
    });
  };

  const beginClear = (previous: T[], action: CngxSelectCommitAction<T[]>): void => {
    // A clear is option-less; a stale toggle marker would put the row
    // spinner on the wrong option.
    togglingOption.set(null);
    ledger.beginMembers<T[]>({
      ...shared,
      kind: 'clear',
      next: [],
      previous,
      action,
      onReplay: () => togglingOption.set(null),
      onSuccess: (finalValues, confirmedPrevious) => {
        togglingOption.set(null);
        opts.onClearFinalize(confirmedPrevious, finalValues);
        opts.core.announce(null, 'removed', finalValues.length, true);
      },
    });
  };

  return { beginToggle, beginClear, retryLast: () => ledger.retry() };
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
 * `CngxTreeSelect` hands this handler its clear only. Tree toggles and cascade
 * toggles commit tree nodes, not option defs, and run through
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` directly; swap that factory to
 * change how a tree toggle commits.
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
