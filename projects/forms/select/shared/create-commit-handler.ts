import { InjectionToken, type Signal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxCommitController } from './commit-controller.token';
import type { CngxSelectCreateAction } from './create-action.types';
import type { LocalItemsBuffer } from './local-items-buffer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Configuration for {@link createCreateCommitHandler}. Callbacks are
 * plain functions - the handler reads no signals beyond
 * `quickCreateAction`, so consumers keep ownership of the reactive
 * surface.
 *
 * Value-shape-agnostic: the handler never writes the component's
 * primary value slot. The consumer's
 * {@link CreateCommitHandlerOptions.onCreated} callback performs the
 * semantic write (single: `value.set(option.value)`; multi: append to
 * `values`) plus `selectionChange` + `created` emissions, so
 * CngxActionSelect and CngxActionMultiSelect share the same factory
 * unchanged.
 *
 * `Prev` carries the previous-snapshot shape (single: `T | undefined`;
 * multi: `readonly T[]`) so `onCreated` receives a typed payload ready
 * to splat into `previousValue(s)`.
 *
 * @category forms/select/commit
 */
export interface CreateCommitHandlerOptions<T, Prev = unknown> {
  /**
   * Active create action. Read per dispatch so a swap mid-flight
   * supersedes cleanly. Lets the handler short-circuit before
   * `begin(...)` when the consumer cleared the input.
   */
  readonly quickCreateAction: Signal<CngxSelectCreateAction<T> | null>;
  /**
   * Shared low-level commit controller. Every create routes through
   * `begin(...)` so supersede, state-machine, and intended-value
   * tracking match every other select-family commit path.
   */
  readonly commitController: CngxCommitController<T>;
  /**
   * Persistent local-items buffer. On success the handler patches a
   * `CngxSelectOptionDef<T>` with the server-returned value and the
   * drafted label; it stays visible until the backend catches up and
   * {@link mergeLocalItems}'s dedup drops the local copy.
   */
  readonly localItemsBuffer: LocalItemsBuffer<T>;
  /**
   * Whether to close the panel after a successful create. Read per
   * dispatch so the consumer can flip the input without a re-bind.
   */
  readonly closeOnSuccess: Signal<boolean>;
  /**
   * Emit the `'create'` change-event payload and write the primary
   * value slot. Fires after `localItemsBuffer` patch and dirty-flag
   * reset, so consumer callbacks can `selectionChange.emit(...)`
   * without racing downstream state.
   */
  readonly onCreated: (created: CngxSelectOptionDef<T>, previousSnapshot: Prev) => void;
  /** Announce the `'created'` delta through the live-region. */
  readonly onAnnounce: (option: CngxSelectOptionDef<T>) => void;
  /** Hook for the consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Hook for the consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
  /** Close the panel (typically `() => component.close()`). */
  readonly onClose: () => void;
  /**
   * Reset the bridge's dirty flag so the next Escape press or
   * click-outside dismisses normally.
   */
  readonly onResetDirty: () => void;
}

/**
 * API returned from {@link createCreateCommitHandler}. `T` is a phantom
 * marker so consumers type the handler as
 * `CreateCommitHandler<Tag, readonly Tag[]>` instead of
 * `CreateCommitHandler<unknown, readonly Tag[]>` - constrains the
 * factory call-site even though only `Prev` appears in the public shape.
 *
 * @category forms/select/commit
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CreateCommitHandler<T, Prev = unknown> {
  /**
   * Run a quick-create through the commit flow. Pessimistic: panel
   * stays open, controller flips to `pending` (drives `isPending`
   * inside the slot context). On success: patch `localItemsBuffer`,
   * fire `onCreated` (consumer writes the value slot), announce,
   * close conditionally. On error: commit-error surface fires; value
   * slot is untouched.
   *
   * **Accepted deviation from plan** (master §3 Commit 5): the plan
   * described an "optimistic add to localItems before commit" path.
   * True optimistic UX requires a `tempValueFactory(draft)` since `T`
   * is opaque to the handler; pessimistic + `isPending` delivers the
   * same perceived immediacy for now.
   *
   * @param draft             Drafted item carrying at least a `label`.
   * @param searchTerm        Live search term at dispatch time.
   * @param previousSnapshot  Consumer-captured snapshot (single:
   *                          `T | undefined`; multi: `readonly T[]`)
   *                          forwarded to `onCreated` unchanged.
   */
  dispatch(draft: { readonly label: string }, searchTerm: string, previousSnapshot: Prev): void;
  /**
   * Re-dispatch the most recent {@link dispatch} call with the cached
   * draft, search term, and previous-value snapshot. Routes through
   * `begin(...)` so supersede semantics apply - a stale retry after a
   * fresh commit is superseded cleanly. No-op when never dispatched.
   *
   * Exposed as the `retry` callback on {@link CngxSelectActionCallbacks};
   * consumer templates wire it to a "Try again" button without
   * re-sourcing the draft.
   */
  retryLast(): void;
}

/**
 * Plain factory for the quick-create commit flow. Shared by
 * `CngxActionSelect` and `CngxActionMultiSelect`. Two separate
 * factories vs {@link createReorderCommitHandler} because create and
 * reorder have different value-shape contracts (materialise new `T` vs
 * reorder existing `T[]`).
 *
 * @category forms/select/commit
 */
export function createCreateCommitHandler<T, Prev = unknown>(
  opts: CreateCommitHandlerOptions<T, Prev>,
): CreateCommitHandler<T, Prev> {
  // Cache of the most recent dispatch payload so `retryLast()` replays
  // without the consumer re-sourcing the draft. Overwritten on every
  // fresh dispatch - a retry after a newer dispatch replays the latest
  // attempt, not a stale one.
  let lastDispatch: {
    readonly draft: { readonly label: string };
    readonly searchTerm: string;
    readonly previousSnapshot: Prev;
  } | null = null;

  function dispatch(
    draft: { readonly label: string },
    searchTerm: string,
    previousSnapshot: Prev,
  ): void {
    const action = opts.quickCreateAction();
    if (!action) {
      return;
    }

    lastDispatch = { draft, searchTerm, previousSnapshot };

    // Adapt to CngxSelectCommitAction<T> so the shared controller drives
    // the lifecycle. `intended` is ignored (always undefined on
    // dispatch) - the payload lives in the closure.
    const adapted = (): ReturnType<CngxSelectCreateAction<T>> => action(searchTerm, draft);

    opts.onStateChange('pending');
    opts.commitController.begin(adapted, undefined, undefined, {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        if (committed === undefined) {
          return;
        }
        const option: CngxSelectOptionDef<T> = {
          value: committed,
          label: draft.label,
        };
        opts.localItemsBuffer.patch(option);
        opts.onResetDirty();
        opts.onCreated(option, previousSnapshot);
        opts.onAnnounce(option);
        if (opts.closeOnSuccess()) {
          opts.onClose();
        }
      },
      onError: (err) => {
        opts.onStateChange('error');
        opts.onError(err);
        // Pessimistic: no rollback - handler never wrote the value
        // slot. Dirty stays raised so the consumer can retry from the
        // still-open slot.
      },
    });
  }

  function retryLast(): void {
    if (lastDispatch === null) {
      return;
    }
    const { draft, searchTerm, previousSnapshot } = lastDispatch;
    dispatch(draft, searchTerm, previousSnapshot);
  }

  return { dispatch, retryLast };
}

/**
 * Signature of the factory behind {@link CNGX_CREATE_COMMIT_HANDLER_FACTORY}.
 *
 * @category forms/select/commit
 */
export type CngxCreateCommitHandlerFactory = <T, Prev = unknown>(
  opts: CreateCommitHandlerOptions<T, Prev>,
) => CreateCommitHandler<T, Prev>;

/**
 * DI token for {@link CreateCommitHandler}. Default
 * {@link createCreateCommitHandler}. Override via `providers` /
 * `viewProviders` for retry-with-backoff, offline queues, audit
 * logging, or telemetry.
 *
 * @category forms/select/commit
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/create-commit-handler.ts
 * @since 0.1.0
 */
export const CNGX_CREATE_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxCreateCommitHandlerFactory>('CngxCreateCommitHandlerFactory', {
    providedIn: 'root',
    factory: () => createCreateCommitHandler,
  });
