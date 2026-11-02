import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';
import { arrayEqual } from '@cngx/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxCommitController } from './commit-controller.token';
import type { CngxSelectOptionDef } from './option.model';
import { commitLedgerFor } from './internal/commit-ledger';

/**
 * Configuration for {@link createReorderCommitHandler}.
 */
export interface ReorderCommitHandlerOptions<T> {
  /** Component's primary value signal. */
  readonly values: WritableSignal<T[]>;
  /** Optimistic vs pessimistic commit UX. */
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /** Current commit action - read per dispatch for supersede safety. */
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /**
   * Shared low-level commit controller. Reorder commits bypass
   * `createArrayCommitHandler` (whose `sameArrayContents` would skip
   * same-membership writes) but run on the same controller, so a reorder
   * supersedes a pending toggle and vice versa.
   */
  readonly commitController: CngxCommitController<T[]>;
  /**
   * Optional notification: called with the pre-reorder order when a commit
   * begins and with the server's canonicalised order on success. Not a
   * rollback hook: the commit ledger rolls a failed reorder back to its
   * confirmed baseline on its own. No shipped composite passes it.
   */
  readonly setLastCommitted?: (values: T[]) => void;
  /**
   * Emit `selectionChange` + `reordered` payload. Consumer controls the
   * shape; signature covers optimistic / pessimistic / no-commit
   * branches.
   */
  readonly onReorder: (
    values: readonly T[],
    previous: readonly T[],
    option: CngxSelectOptionDef<T> | null,
    fromIndex: number,
    toIndex: number,
  ) => void;
  /**
   * Announce the reorder. Pulled out so consumers can route to a
   * custom announcer without forking.
   */
  readonly onAnnounce: (
    option: CngxSelectOptionDef<T> | null,
    fromIndex: number,
    toIndex: number,
    count: number,
  ) => void;
  /** Hook for the consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Hook for the consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
  /**
   * Announce a failed reorder to AT, after the order was rolled back. Wire
   * it to the commit-error announcer (`CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`).
   * When omitted a failed reorder is announced nothing; `onError` still
   * fires. `rolledBack` is `true` when the previous order was restored
   * before the call.
   */
  readonly announceError?: (err: unknown, rolledBack?: boolean) => void;
}

/**
 * API returned from {@link createReorderCommitHandler}.
 */
export interface ReorderCommitHandler<T> {
  /**
   * Run a reorder through the commit flow.
   * - No commit: write `values`, fire `onReorder` + `onAnnounce`.
   * - Optimistic: write, emit, begin commit. Success reconciles with
   *   the server's canonicalised value; error rolls back.
   * - Pessimistic: hold `values`, emit `'pending'`, begin commit.
   *   Success writes + emits; error leaves `values` untouched.
   *
   * Always writes on success regardless of same-membership - the point
   * of this factory is to bypass `sameArrayContents`.
   */
  dispatch(
    next: T[],
    previous: T[],
    fromIndex: number,
    toIndex: number,
    option: CngxSelectOptionDef<T> | null,
  ): void;
  /**
   * Replay the last failed reorder this handler started (the commit-error
   * Retry). The composite routes Retry here whenever this handler started
   * the last commit, so a custom handler owns its own replay. No-op once
   * the reorder succeeded or without a bound `commitAction`.
   */
  retryLast(): void;
}

/**
 * Plain factory for the reorder-commit flow used by
 * `CngxReorderableMultiSelect`. Operates on ordered arrays with
 * same-membership semantics.
 *
 * Why a separate factory (not a flag on `createArrayCommitHandler`):
 * the array handler reconciles with `sameArrayContents`, which would skip
 * a pure reorder. Both are thin adapters over the same internal commit
 * ledger; this one records kind `reorder` with order-sensitive equality,
 * rolls back before `announceError` speaks and lets Retry replay the
 * reorder.
 */
export function createReorderCommitHandler<T>(
  opts: ReorderCommitHandlerOptions<T>,
): ReorderCommitHandler<T> {
  const ledger = commitLedgerFor<T[], T>(opts.commitController);

  function dispatch(
    next: T[],
    previous: T[],
    fromIndex: number,
    toIndex: number,
    option: CngxSelectOptionDef<T> | null,
  ): void {
    const action = opts.commitAction();

    if (!action) {
      opts.values.set(next);
      opts.onReorder(next, previous, option, fromIndex, toIndex);
      opts.onAnnounce(option, fromIndex, toIndex, next.length);
      return;
    }

    opts.setLastCommitted?.([...previous]);
    if (opts.commitMode() === 'optimistic') {
      opts.values.set(next);
      opts.onReorder(next, previous, option, fromIndex, toIndex);
      opts.onAnnounce(option, fromIndex, toIndex, next.length);
    }
    ledger.beginMembers<T[]>({
      kind: 'reorder',
      next,
      previous: [...previous],
      option,
      meta: { fromIndex, toIndex },
      action,
      commitAction: opts.commitAction,
      value: opts.values,
      // Order-sensitive: a same-membership reorder must still be written.
      same: arrayEqual,
      copy: (v) => [...v],
      commitMode: opts.commitMode,
      onStateChange: opts.onStateChange,
      onSuccess: (final, confirmedPrevious) => {
        opts.setLastCommitted?.([...final]);
        if (opts.commitMode() === 'pessimistic') {
          opts.onReorder(final, confirmedPrevious, option, fromIndex, toIndex);
          opts.onAnnounce(option, fromIndex, toIndex, final.length);
        }
      },
      onError: opts.onError,
      announceError: opts.announceError,
    });
  }

  return { dispatch, retryLast: () => ledger.retry() };
}

/**
 * Signature of the factory behind {@link CNGX_REORDER_COMMIT_HANDLER_FACTORY}.
 */
export type CngxReorderCommitHandlerFactory = <T>(
  opts: ReorderCommitHandlerOptions<T>,
) => ReorderCommitHandler<T>;

/**
 * Factory for the reorder-commit handler - persists `CngxReorderableMultiSelect`
 * drag and keyboard reorders. Default `createReorderCommitHandler`. Override via
 * `providers` / `viewProviders` for retry-with-backoff, offline queues, audit
 * logging, or telemetry.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/reorder-commit-handler.ts
 * @since 0.1.0
 * @relatedTo CngxReorderableMultiSelect, CNGX_SELECT_COMMIT_CONTROLLER_FACTORY
 */
export const CNGX_REORDER_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxReorderCommitHandlerFactory>('CngxReorderCommitHandlerFactory', {
    providedIn: 'root',
    factory: () => createReorderCommitHandler,
  });
