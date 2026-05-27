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
 * Minimum shape the chip-removal factory needs — just `.value`. Concrete
 * chip types layer label, disabled, etc. on top.
 *
 * @category forms/select/commit
 */
export interface CngxChipRemovableItem<T> {
  readonly value: T;
}

/**
 * Config for {@link createChipRemovalHandler}.
 *
 * Standard-body flow: disabled-guard → snapshot → `compareWith` filter →
 * commit branch (optimistic write + `beginCommit`) or sync branch
 * (`values.set(next)` + `onSyncFinalize`). Closures cached per-item via
 * `WeakMap` for stable identity.
 *
 * @category forms/select/commit
 */
export interface CngxChipRemovalHandlerOptions<
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
> {
  /** When `true`, `removeByValue` is a no-op. */
  readonly disabled: Signal<boolean>;

  /**
   * Replaces the entire post-disabled-guard body. WeakMap closure cache
   * still applied. Use for variants whose remove semantics diverge from
   * the standard filter+commit body — e.g. `CngxTreeSelect` always
   * single-deselects regardless of `cascadeChildren`. When set, the
   * standard-body fields are ignored.
   */
  readonly removeOverride?: (item: Item) => void;

  /** Required unless `removeOverride` is set. */
  readonly values?: WritableSignal<T[]>;
  /** Element-wise equality for filtering. */
  readonly compareWith?: Signal<CngxSelectCompareFn<T>>;
  /** `null` → sync path only. */
  readonly commitAction?: Signal<CngxSelectCommitAction<T[]> | null>;
  readonly commitMode?: Signal<CngxSelectCommitMode>;
  /** Typically wired to `ArrayCommitHandler.beginToggle`. */
  readonly beginCommit?: (
    next: T[],
    previous: T[],
    item: Item,
    action: CngxSelectCommitAction<T[]>,
  ) => void;
  /**
   * Runs before `beginCommit`. Stash rollback snapshot + mark the toggling
   * option here.
   */
  readonly onBeforeCommit?: (previous: T[], item: Item) => void;
  /**
   * Runs on the sync branch after `values.set(next)`. Consumer emits the
   * change event and announces.
   */
  readonly onSyncFinalize?: (item: Item, previous: T[]) => void;
}

/**
 * API returned from {@link createChipRemovalHandler}.
 *
 * @category forms/select/commit
 */
export interface CngxChipRemovalHandler<
  Item extends CngxChipRemovableItem<unknown>,
> {
  /** Apply the removal body. Bind directly to `(remove)` or Backspace. */
  removeByValue(item: Item): void;
  /**
   * Stable closure wrapping {@link removeByValue}, cached per-item via
   * WeakMap. Safe to pass into chip-slot context without view thrash.
   */
  removeFor(item: Item): () => void;
}

/**
 * Builds a {@link CngxChipRemovalHandler}. Owns disabled-guard, snapshot,
 * filter, branch dispatch, WeakMap closure stability. Consumer owns the
 * commit dispatch (`beginCommit`), rollback snapshotting
 * (`onBeforeCommit`), and change-event emission (`onSyncFinalize`).
 *
 * @category forms/select/commit
 */
export function createChipRemovalHandler<
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
>(
  opts: CngxChipRemovalHandlerOptions<T, Item>,
): CngxChipRemovalHandler<Item> {
  const cache = new WeakMap<object, () => void>();

  // Standard-body fields required without removeOverride. Throw at
  // construction instead of at first chip-remove click.
  if (!opts.removeOverride) {
    const missing: string[] = [];
    if (!opts.values) {
      missing.push('values');
    }
    if (!opts.compareWith) {
      missing.push('compareWith');
    }
    if (!opts.commitAction) {
      missing.push('commitAction');
    }
    if (!opts.commitMode) {
      missing.push('commitMode');
    }
    if (!opts.beginCommit) {
      missing.push('beginCommit');
    }
    if (!opts.onSyncFinalize) {
      missing.push('onSyncFinalize');
    }
    if (missing.length > 0) {
      throw new Error(
        `[CngxChipRemovalHandler] Missing required field(s): ${missing.join(
          ', ',
        )}. Provide them, or pass \`removeOverride\` to bypass the standard body.`,
      );
    }
  }

  const removeByValue = (item: Item): void => {
    if (opts.disabled()) {
      return;
    }
    if (opts.removeOverride) {
      opts.removeOverride(item);
      return;
    }
    // Non-null assertions guarded by the construction-time validation above.
    const values = opts.values!;
    const compareWith = opts.compareWith!;
    const commitAction = opts.commitAction!;
    const commitMode = opts.commitMode!;
    const beginCommit = opts.beginCommit!;
    const onSyncFinalize = opts.onSyncFinalize!;

    const previous = [...values()];
    const eq = compareWith();
    const next = previous.filter((v) => !eq(v, item.value));
    const action = commitAction();
    if (action) {
      opts.onBeforeCommit?.(previous, item);
      if (commitMode() === 'optimistic') {
        values.set(next);
      }
      beginCommit(next, previous, item, action);
      return;
    }
    values.set(next);
    onSyncFinalize(item, previous);
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
 * Factory signature for {@link CNGX_CHIP_REMOVAL_HANDLER_FACTORY}.
 *
 * @category forms/select/commit
 */
export type CngxChipRemovalHandlerFactory = <
  T,
  Item extends CngxChipRemovableItem<T> = CngxSelectOptionDef<T>,
>(
  opts: CngxChipRemovalHandlerOptions<T, Item>,
) => CngxChipRemovalHandler<Item>;

/**
 * Factory token for {@link CngxChipRemovalHandler}. Default
 * {@link createChipRemovalHandler}. Override to wrap with telemetry,
 * confirm-before-remove, or offline-queue semantics.
 *
 * @category forms/select/commit
 */
export const CNGX_CHIP_REMOVAL_HANDLER_FACTORY =
  new InjectionToken<CngxChipRemovalHandlerFactory>(
    'CngxChipRemovalHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createChipRemovalHandler,
    },
  );
