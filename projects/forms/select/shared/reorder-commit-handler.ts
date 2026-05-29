import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxCommitController } from './commit-controller.token';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Configuration for {@link createReorderCommitHandler}.
 *
 * @category forms/select/reorderable-multi-select
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
   * same-membership writes) and drive this controller directly.
   */
  readonly commitController: CngxCommitController<T[]>;
  /** Read the last successfully committed snapshot (rollback target). */
  readonly getLastCommitted: () => T[];
  /**
   * Update the rollback snapshot. Called on optimistic-mode begin
   * (stash pre-reorder state) and on success (store canonicalised
   * server value).
   */
  readonly setLastCommitted: (values: T[]) => void;
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
}

/**
 * API returned from {@link createReorderCommitHandler}.
 *
 * @category forms/select/reorderable-multi-select
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
}

/**
 * Plain factory for the reorder-commit flow used by
 * `CngxReorderableMultiSelect`. Operates on ordered arrays with
 * same-membership semantics.
 *
 * Why a separate factory (not a flag on `createArrayCommitHandler`):
 * the array handler's `reconcileValues` uses `sameArrayContents` to
 * short-circuit writes when the target matches current state - a pure
 * reorder would silently skip. A `bypassReconcile` flag would
 * complicate every other call-site; a dedicated factory keeps the
 * array handler's hot path small.
 *
 * `CngxTreeSelect.dispatchValueChange` follows the same pattern
 * inline; a future refactor could lift it here.
 *
 * @category forms/select/reorderable-multi-select
 */
export function createReorderCommitHandler<T>(
  opts: ReorderCommitHandlerOptions<T>,
): ReorderCommitHandler<T> {
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

    opts.setLastCommitted([...previous]);
    if (opts.commitMode() === 'optimistic') {
      opts.values.set(next);
      opts.onReorder(next, previous, option, fromIndex, toIndex);
      opts.onAnnounce(option, fromIndex, toIndex, next.length);
    }
    opts.onStateChange('pending');
    opts.commitController.begin(action, next, [...previous], {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        const final = committed ?? next;
        // Always write - server canonicalisation may differ from the
        // optimistic `next`.
        opts.values.set([...final]);
        opts.setLastCommitted([...final]);
        if (opts.commitMode() === 'pessimistic') {
          opts.onReorder(final, previous, option, fromIndex, toIndex);
          opts.onAnnounce(option, fromIndex, toIndex, final.length);
        }
      },
      onError: (err, rollbackTo) => {
        opts.onStateChange('error');
        opts.onError(err);
        if (opts.commitMode() === 'optimistic') {
          opts.values.set([...(rollbackTo ?? previous)]);
        }
      },
    });
  }

  return { dispatch };
}

/**
 * Signature of the factory behind {@link CNGX_REORDER_COMMIT_HANDLER_FACTORY}.
 *
 * @category forms/select/reorderable-multi-select
 */
export type CngxReorderCommitHandlerFactory = <T>(
  opts: ReorderCommitHandlerOptions<T>,
) => ReorderCommitHandler<T>;

/**
 * DI token for {@link ReorderCommitHandler}. Default
 * {@link createReorderCommitHandler}. Override via `providers` /
 * `viewProviders` for retry-with-backoff, offline queues, audit
 * logging, or telemetry.
 *
 * @category forms/select/reorderable-multi-select
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/reorder-commit-handler.ts
 * @since 0.1.0
 */
export const CNGX_REORDER_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxReorderCommitHandlerFactory>('CngxReorderCommitHandlerFactory', {
    providedIn: 'root',
    factory: () => createReorderCommitHandler,
  });
