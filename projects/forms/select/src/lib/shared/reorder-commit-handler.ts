import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxCommitController } from './commit-controller';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Configuration for {@link createReorderCommitHandler}.
 *
 * @category interactive
 */
export interface ReorderCommitHandlerOptions<T> {
  /** Component's primary value signal. */
  readonly values: WritableSignal<T[]>;
  /** Optimistic vs pessimistic commit UX. */
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /** Current commit action — read per dispatch for supersede safety. */
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /**
   * Shared low-level commit controller. Reorder commits bypass
   * `createArrayCommitHandler` — `sameArrayContents` would skip the
   * write on same-membership reorders — and drive this controller
   * directly.
   */
  readonly commitController: CngxCommitController<T[]>;
  /** Read the last successfully committed snapshot (rollback target). */
  readonly getLastCommitted: () => T[];
  /**
   * Update the last successfully committed snapshot. Called on
   * optimistic-mode begin (stash the pre-reorder state) and on commit
   * success (store the canonicalized server value).
   */
  readonly setLastCommitted: (values: T[]) => void;
  /**
   * Emit the semantic `selectionChange` + `reordered` payload.
   * Consumer controls the change-event shape (signature mirrors the
   * optimistic / pessimistic / no-commit branches the handler drives).
   */
  readonly onReorder: (
    values: readonly T[],
    previous: readonly T[],
    option: CngxSelectOptionDef<T> | null,
    fromIndex: number,
    toIndex: number,
  ) => void;
  /**
   * Announce the reorder through the select-family live region.
   * Pulled out as a callback so the handler stays value-shape-agnostic
   * beyond `T[]` — consumers can route to a custom announcer without
   * forking the handler.
   */
  readonly onAnnounce: (
    option: CngxSelectOptionDef<T> | null,
    fromIndex: number,
    toIndex: number,
    count: number,
  ) => void;
  /** State-transition hook for the consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Error-forward hook for the consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
}

/**
 * API returned from {@link createReorderCommitHandler}.
 *
 * @category interactive
 */
export interface ReorderCommitHandler<T> {
  /**
   * Run a reorder through the commit flow. No-commit path writes
   * `values` immediately and fires `onReorder` + `onAnnounce`.
   * Optimistic path writes immediately, emits the intent, then begins
   * the commit — success reconciles with the server's canonicalized
   * value, error rolls back. Pessimistic path holds `values`, emits
   * `'pending'`, begins the commit — success writes + emits, error
   * leaves `values` untouched and emits `onError`.
   *
   * Always writes on success regardless of same-membership semantics —
   * the point of this factory is to bypass the `sameArrayContents`
   * short-circuit that {@link createArrayCommitHandler} uses.
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
 * Plain factory for the reorder-commit flow. Extracted from
 * `CngxReorderableMultiSelect` so enterprise consumers can swap in
 * retry-with-backoff, offline-queue, or telemetry wrappers without
 * forking the component. Mirrors the shape of
 * {@link createArrayCommitHandler} but operates on ordered arrays with
 * same-membership semantics.
 *
 * **Why a separate factory** (not a flag on `createArrayCommitHandler`):
 * the array handler's `reconcileValues` uses `sameArrayContents` to
 * short-circuit writes when the target matches current state — a pure
 * reorder (same values, new order) would be silently skipped. Carrying
 * a `bypassReconcile` flag through the array handler would complicate
 * every other call-site. A dedicated factory with its own contract is
 * clearer and keeps the array handler's hot path small.
 *
 * **Tree-select parity**: `CngxTreeSelect.dispatchValueChange` follows
 * the same pattern inline — a future refactor could lift that path
 * into this factory too.
 *
 * @category interactive
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
        // Always write — server canonicalisation may have reordered
        // differently from the optimistic `next` value.
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
 * @category interactive
 */
export type CngxReorderCommitHandlerFactory = <T>(
  opts: ReorderCommitHandlerOptions<T>,
) => ReorderCommitHandler<T>;

/**
 * DI token resolving the factory used to instantiate a
 * {@link ReorderCommitHandler}. Defaults to
 * {@link createReorderCommitHandler}; override via `providers` /
 * `viewProviders` to attach retry-with-backoff, offline queues, audit
 * logging, or telemetry without forking any reorder-aware component.
 *
 * Symmetrical to `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` — same layering
 * level, complementary contract (same-membership reorders instead of
 * add/remove).
 *
 * @category interactive
 */
export const CNGX_REORDER_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxReorderCommitHandlerFactory>(
    'CngxReorderCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createReorderCommitHandler,
    },
  );
