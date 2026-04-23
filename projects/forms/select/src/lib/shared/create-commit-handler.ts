import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

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
 * @category interactive
 */
export interface CreateCommitHandlerOptions<T> {
  /**
   * Primary value signal. On success the handler writes the
   * server-returned `T` so the newly-created item becomes the current
   * single-value selection.
   */
  readonly value: WritableSignal<T | undefined>;
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
  /** Emit the semantic `'create'` change-event payload. */
  readonly onCreated: (
    created: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
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
 * API returned from {@link createCreateCommitHandler}.
 *
 * @category interactive
 */
export interface CreateCommitHandler<T> {
  /**
   * Run a quick-create through the commit flow. Pessimistic: the
   * handler keeps the panel open, flips the commit controller to
   * `pending` (which drives the `isPending` flag inside the slot
   * context), and on success patches `localItemsBuffer` + writes
   * `value` + announces + conditionally closes. On error the
   * commit-error surface fires; `value` is not touched.
   *
   * **Accepted deviation from plan** (master §3 Commit 5): the plan
   * described an "optimistic add to localItems before commit" path.
   * True optimistic UX requires a `tempValueFactory(draft)` since `T`
   * is opaque to the handler; shipping that cleanly is a follow-up.
   * Pessimistic + `isPending` feedback delivers the same perceived
   * immediacy for the common case.
   *
   * @param draft          Drafted item carrying at least a `label`.
   * @param searchTerm     Live search term at dispatch time.
   * @param previousValue  Value to restore if a later dispatch
   *                       supersedes this one via the commit controller.
   */
  dispatch(
    draft: { readonly label: string },
    searchTerm: string,
    previousValue: T | undefined,
  ): void;
}

/**
 * Plain factory for the quick-create commit flow. Extracted from
 * `CngxActionSelect` so enterprise consumers can swap in
 * retry-with-backoff, offline-queue, or telemetry wrappers without
 * forking the component. Mirrors the shape of
 * {@link /projects/forms/select/src/lib/shared/reorder-commit-handler.ts
 * createReorderCommitHandler} — two separate factories because create
 * and reorder have fundamentally different value-shape contracts
 * (materialise new `T` vs reorder existing `T[]`).
 *
 * @category interactive
 */
export function createCreateCommitHandler<T>(
  opts: CreateCommitHandlerOptions<T>,
): CreateCommitHandler<T> {
  function dispatch(
    draft: { readonly label: string },
    searchTerm: string,
    previousValue: T | undefined,
  ): void {
    const action = opts.quickCreateAction();
    if (!action) {
      return;
    }

    // Adapt the create-action signature to CngxSelectCommitAction<T> so
    // the shared commit controller's state-machine drives the lifecycle
    // identically to every other select-family commit path. The adapter
    // ignores `intended` (always undefined on dispatch) — the payload
    // lives in the closure over `searchTerm` + `draft`.
    const adapted = (): ReturnType<CngxSelectCreateAction<T>> =>
      action(searchTerm, draft);

    opts.onStateChange('pending');
    opts.commitController.begin(adapted, undefined, previousValue, {
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
        opts.value.set(committed);
        opts.onResetDirty();
        opts.onCreated(option, previousValue);
        opts.onAnnounce(option);
        if (opts.closeOnSuccess()) {
          opts.onClose();
        }
      },
      onError: (err) => {
        opts.onStateChange('error');
        opts.onError(err);
        // Pessimistic: value was never touched — no rollback needed.
        // The dirty flag stays raised so the consumer can retry from
        // the still-open slot.
      },
    });
  }

  return { dispatch };
}

/**
 * Signature of the factory behind {@link CNGX_CREATE_COMMIT_HANDLER_FACTORY}.
 *
 * @category interactive
 */
export type CngxCreateCommitHandlerFactory = <T>(
  opts: CreateCommitHandlerOptions<T>,
) => CreateCommitHandler<T>;

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
