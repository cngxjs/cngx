import { InjectionToken, type Signal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxCommitController } from './commit-controller';
import type { CngxSelectCreateAction } from './create-action.types';
import type { LocalItemsBuffer } from './local-items-buffer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Configuration for {@link createCreateCommitHandler}. Every callback
 * is a plain function — the handler never reads signals directly
 * (except through the `quickCreateAction` signal input) so consumers
 * keep tight ownership of the reactive surface.
 *
 * The factory is value-shape-agnostic: it never writes a component's
 * primary value slot itself (single-`T` vs `T[]`). The consumer's
 * {@link CreateCommitHandlerOptions.onCreated} callback performs the
 * semantic write (single: `value.set(option.value)`; multi: append to
 * `values`) together with `selectionChange` + `created` emissions, so
 * CngxActionSelect and CngxActionMultiSelect share the same factory
 * without branching.
 *
 * The `Prev` generic carries the previous-snapshot shape each
 * consumer captures before dispatching (single: `T | undefined`;
 * multi: `readonly T[]`) so `onCreated` receives a typed previous
 * payload ready to splat into the `previousValue(s)` field of the
 * variant's change event.
 *
 * @category interactive
 */
export interface CreateCommitHandlerOptions<T, Prev = unknown> {
  /**
   * Active create action. Read per dispatch so a swap mid-flight
   * supersedes cleanly — the commit controller owns the supersede
   * semantics, this signal just lets the handler short-circuit
   * before `begin(...)` when the consumer has cleared the input.
   */
  readonly quickCreateAction: Signal<CngxSelectCreateAction<T> | null>;
  /**
   * Shared low-level commit controller. The handler routes every
   * create through `begin(...)` so supersede, state-machine, and
   * intended-value tracking stay identical to every other
   * select-family commit path.
   */
  readonly commitController: CngxCommitController<T>;
  /**
   * Persistent local-items buffer. On successful create the handler
   * patches a `CngxSelectOptionDef<T>` with the server-returned value
   * and the drafted label — it stays visible across subsequent state
   * refetches until the backend catches up (whereupon
   * {@link /projects/forms/select/src/lib/shared/option.model.ts
   * mergeLocalItems}'s dedup drops the local copy silently).
   */
  readonly localItemsBuffer: LocalItemsBuffer<T>;
  /**
   * Whether to close the panel after a successful create. Read per
   * dispatch so the consumer can flip the input without a re-bind.
   */
  readonly closeOnSuccess: Signal<boolean>;
  /**
   * Emit the semantic `'create'` change-event payload AND write the
   * component's primary value slot. The handler fires this after it
   * has patched `localItemsBuffer` and reset the action-bridge dirty
   * flag, so consumer callbacks can freely invoke
   * `selectionChange.emit(...)` without racing their own downstream
   * state.
   */
  readonly onCreated: (
    created: CngxSelectOptionDef<T>,
    previousSnapshot: Prev,
  ) => void;
  /** Announce the `'created'` delta through the select-family live region. */
  readonly onAnnounce: (option: CngxSelectOptionDef<T>) => void;
  /** State-transition hook for the consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Error-forward hook for the consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
  /** Close the panel (usually `() => component.close()`). */
  readonly onClose: () => void;
  /**
   * Reset the bridge's dirty flag. Called after a successful create so
   * the next Escape press or click-outside dismisses normally.
   */
  readonly onResetDirty: () => void;
}

/**
 * API returned from {@link createCreateCommitHandler}. `T` is a
 * phantom marker so consumers type the handler as
 * `CreateCommitHandler<Tag, readonly Tag[]>` rather than
 * `CreateCommitHandler<unknown, readonly Tag[]>` — it constrains the
 * factory call-site even though the public shape only mentions `Prev`.
 *
 * @category interactive
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CreateCommitHandler<T, Prev = unknown> {
  /**
   * Run a quick-create through the commit flow. Pessimistic: the
   * handler keeps the panel open, flips the commit controller to
   * `pending` (which drives the `isPending` flag inside the slot
   * context), and on success patches `localItemsBuffer` + fires
   * `onCreated` (where the consumer writes its primary value slot) +
   * announces + conditionally closes. On error the commit-error
   * surface fires; the consumer's value slot is not touched.
   *
   * **Accepted deviation from plan** (master §3 Commit 5): the plan
   * described an "optimistic add to localItems before commit" path.
   * True optimistic UX requires a `tempValueFactory(draft)` since `T`
   * is opaque to the handler; shipping that cleanly is a follow-up.
   * Pessimistic + `isPending` feedback delivers the same perceived
   * immediacy for the common case.
   *
   * @param draft             Drafted item carrying at least a `label`.
   * @param searchTerm        Live search term at dispatch time.
   * @param previousSnapshot  Consumer-captured snapshot (single:
   *                          `T | undefined`; multi: `readonly T[]`)
   *                          forwarded to `onCreated` unchanged so
   *                          the consumer can emit a typed
   *                          `previousValue(s)` on its change event.
   */
  dispatch(
    draft: { readonly label: string },
    searchTerm: string,
    previousSnapshot: Prev,
  ): void;
  /**
   * Re-dispatch the most recent {@link dispatch} call with the exact
   * draft, search term, and previous-value snapshot captured on that
   * original invocation. Routes through the same commit-controller
   * `begin(...)` path so supersede semantics apply — a stale retry
   * invoked after the consumer has moved on to a fresh commit is
   * superseded cleanly without touching the new pipeline. No-op when
   * the handler has never been dispatched (no cached triple to
   * replay).
   *
   * Exposed as the `retry` callback on {@link CngxSelectActionCallbacks}
   * via the action-host bridge — consumer templates read
   * `*cngxSelectAction`'s `retry` context field and call it from a
   * "Nochmal versuchen" button without re-sourcing the draft from
   * their own form state.
   */
  retryLast(): void;
}

/**
 * Plain factory for the quick-create commit flow. Extracted from
 * `CngxActionSelect` (Commit 5) and reused by `CngxActionMultiSelect`
 * (Commit 6). Enterprise consumers can swap in retry-with-backoff,
 * offline-queue, or telemetry wrappers without forking either
 * component. Mirrors the shape of
 * {@link /projects/forms/select/src/lib/shared/reorder-commit-handler.ts
 * createReorderCommitHandler} — two separate factories because create
 * and reorder have fundamentally different value-shape contracts
 * (materialise new `T` vs reorder existing `T[]`).
 *
 * @category interactive
 */
export function createCreateCommitHandler<T, Prev = unknown>(
  opts: CreateCommitHandlerOptions<T, Prev>,
): CreateCommitHandler<T, Prev> {
  // Cache of the most recent dispatch payload so `retryLast()` can
  // replay it without the consumer re-sourcing the draft. Reset on
  // every fresh dispatch so a retry after a subsequent (different)
  // dispatch replays the latest attempt, not a stale earlier one.
  let lastDispatch:
    | {
        readonly draft: { readonly label: string };
        readonly searchTerm: string;
        readonly previousSnapshot: Prev;
      }
    | null = null;

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

    // Adapt the create-action signature to CngxSelectCommitAction<T> so
    // the shared commit controller's state-machine drives the lifecycle
    // identically to every other select-family commit path. The adapter
    // ignores `intended` (always undefined on dispatch) — the payload
    // lives in the closure over `searchTerm` + `draft`.
    const adapted = (): ReturnType<CngxSelectCreateAction<T>> =>
      action(searchTerm, draft);

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
        // Pessimistic: no rollback — the consumer's value slot was
        // never written by the handler. The dirty flag stays raised so
        // the consumer can retry from the still-open slot.
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
 * @category interactive
 */
export type CngxCreateCommitHandlerFactory = <T, Prev = unknown>(
  opts: CreateCommitHandlerOptions<T, Prev>,
) => CreateCommitHandler<T, Prev>;

/**
 * DI token resolving the factory used to instantiate a
 * {@link CreateCommitHandler}. Defaults to
 * {@link createCreateCommitHandler}; override via `providers` /
 * `viewProviders` to attach retry-with-backoff, offline queues, audit
 * logging, or telemetry without forking `CngxActionSelect` /
 * `CngxActionMultiSelect`.
 *
 * Symmetrical to `CNGX_REORDER_COMMIT_HANDLER_FACTORY` — same layering
 * level, complementary contract (materialise new `T` instead of reorder
 * existing `T[]`).
 *
 * @category interactive
 */
export const CNGX_CREATE_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxCreateCommitHandlerFactory>(
    'CngxCreateCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createCreateCommitHandler,
    },
  );
