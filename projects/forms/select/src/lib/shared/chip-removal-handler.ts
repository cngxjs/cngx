import {
  InjectionToken,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';

/**
 * Minimal shape the chip-removal factory cares about on the carried
 * "item". Every chip-strip (multi-select, combobox, reorderable,
 * action-multi-select, tree-select) passes items with a `.value` — the
 * label / disabled / etc. live on the concrete `CngxSelectOptionDef<T>`
 * or `CngxTreeSelectedItem<T>` and aren't touched by the factory body.
 *
 * Exposed as a type alias rather than an inline constraint so the DI
 * factory signature can reference it without copying the shape.
 *
 * @category interactive
 */
export interface CngxChipRemovableItem<T> {
  readonly value: T;
}

/**
 * Configuration for {@link createChipRemovalHandler}.
 *
 * The factory absorbs the bit-identical "remove one chip" body shared
 * by every multi-value select variant:
 *
 *   1. disabled-guard (early return),
 *   2. `[...values()]` snapshot,
 *   3. `compareWith`-filtered "next" array,
 *   4. branch: commit-action present → optimistic write + delegate to
 *      `beginCommit`; otherwise → synchronous write + `onSyncFinalize`,
 *   5. per-item `WeakMap` closure cache so `remove: handler.removeFor(item)`
 *      returns stable identity across CD cycles (no `ngTemplateOutlet`
 *      thrash on the chip slot).
 *
 * @category interactive
 */
export interface CngxChipRemovalHandlerOptions<
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
> {
  /** Primary value signal — the array from which the chip's value is removed. */
  readonly values: WritableSignal<T[]>;
  /** When `true`, every `removeByValue(...)` call is a no-op. */
  readonly disabled: Signal<boolean>;
  /** Element-wise equality used to filter the current `values()` array. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /** Current commit action. `null` → synchronous path only. */
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  /** Optimistic vs pessimistic commit UX. Only consulted on the commit branch. */
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /**
   * Variant-specific commit dispatch. Typically wired to
   * `ArrayCommitHandler.beginToggle`. Tree-select passes a direct
   * `commitController.begin()` wrapper so the factory stays
   * shape-agnostic beyond the `T[]` commitment.
   */
  readonly beginCommit: (
    next: T[],
    previous: T[],
    item: Item,
    action: CngxSelectCommitAction<T[]>,
  ) => void;
  /**
   * Called **before** `beginCommit`. Use to stash the rollback snapshot
   * (`lastCommittedValues = previous`) and mark the toggling option
   * (`togglingOption.set(item)`) — both are variant-scoped side effects
   * that shouldn't leak into the shared factory body.
   */
  readonly onBeforeCommit?: (previous: T[], item: Item) => void;
  /**
   * Called on the non-commit branch **after** the synchronous
   * `values.set(next)` write. Consumer emits its variant-specific
   * change event (`selectionChange`, `optionToggled`, `cleared`) and
   * announces the removal to AT.
   */
  readonly onSyncFinalize: (item: Item, previous: T[]) => void;
}

/**
 * API returned from {@link createChipRemovalHandler}.
 *
 * @category interactive
 */
export interface CngxChipRemovalHandler<
  Item extends CngxChipRemovableItem<unknown>,
> {
  /**
   * Apply the removal body (disabled-guard + snapshot + filter + branch).
   * Call directly from `(remove)` bindings on the default chip pill or
   * from keyboard handlers (e.g. Backspace-on-empty).
   */
  removeByValue(item: Item): void;
  /**
   * Stable-identity wrapper around {@link removeByValue}. The returned
   * closure is cached per-item via a `WeakMap` so repeated calls with
   * the same item reference yield the same function identity — safe to
   * pass into `*cngxMultiSelectChip` / `*cngxTreeSelectChip` context
   * without triggering embedded-view thrash on every CD cycle.
   */
  removeFor(item: Item): () => void;
}

/**
 * Factory producing a {@link CngxChipRemovalHandler}. Eliminates the
 * ~60 LOC of near-identical `removeOption` + `chipRemoveFor` boilerplate
 * that every chip-carrying select variant previously duplicated.
 *
 * **Why a factory (not a service).** Signal-first libraries favour
 * plain functions returning objects over class hierarchies. The handler
 * has no inheritance concerns, no lifecycle hooks, and no DI-visible
 * identity — a factory matches the rest of the repo
 * (`createCommitController`, `createArrayCommitHandler`,
 * `createTypeaheadController`). See `reference_api_prefix_convention.md`.
 *
 * **Responsibility split.** The handler owns:
 *   - disabled-guard + snapshot + filter,
 *   - commit / non-commit branch dispatch,
 *   - WeakMap closure stability.
 *
 * The consumer owns:
 *   - the concrete commit dispatch (`beginCommit`) — so tree-select's
 *     non-array-committed flow and the array variants' shared
 *     `ArrayCommitHandler.beginToggle` both fit,
 *   - variant-scoped rollback snapshotting (`onBeforeCommit`),
 *   - change-event emission + announcer call (`onSyncFinalize`).
 *
 * @category interactive
 */
export function createChipRemovalHandler<
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
>(
  opts: CngxChipRemovalHandlerOptions<T, Item>,
): CngxChipRemovalHandler<Item> {
  const cache = new WeakMap<object, () => void>();

  const removeByValue = (item: Item): void => {
    if (opts.disabled()) {
      return;
    }
    const previous = [...opts.values()];
    const eq = opts.compareWith();
    const next = previous.filter((v) => !eq(v, item.value));
    const action = opts.commitAction();
    if (action) {
      opts.onBeforeCommit?.(previous, item);
      if (opts.commitMode() === 'optimistic') {
        opts.values.set(next);
      }
      opts.beginCommit(next, previous, item, action);
      return;
    }
    opts.values.set(next);
    opts.onSyncFinalize(item, previous);
  };

  const removeFor = (item: Item): (() => void) => {
    const key = item as unknown as object;
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    const fn = (): void => {
      removeByValue(item);
    };
    cache.set(key, fn);
    return fn;
  };

  return { removeByValue, removeFor };
}

/**
 * Factory-signature type — mirrors {@link createChipRemovalHandler} so
 * DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxChipRemovalHandlerFactory = <
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
>(
  opts: CngxChipRemovalHandlerOptions<T, Item>,
) => CngxChipRemovalHandler<Item>;

/**
 * DI token resolving the factory used to instantiate a
 * {@link CngxChipRemovalHandler}. Defaults to
 * {@link createChipRemovalHandler}; override app-wide via
 * `providers: [{ provide: CNGX_CHIP_REMOVAL_HANDLER_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to wrap the default with
 * telemetry, audit-logging, confirm-dialog-before-remove, or offline-
 * queue semantics — without forking any chip-carrying select variant.
 *
 * Symmetrical to `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` and
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` — the three tokens compose a
 * full enterprise swap surface for the remove-one-chip lifecycle.
 *
 * @category interactive
 */
export const CNGX_CHIP_REMOVAL_HANDLER_FACTORY =
  new InjectionToken<CngxChipRemovalHandlerFactory>(
    'CngxChipRemovalHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createChipRemovalHandler,
    },
  );
