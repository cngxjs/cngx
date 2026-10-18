import { computed, type Signal } from '@angular/core';

import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxSelectOptionsInput } from '../option.model';

/**
 * Re-types a consumer `[state]` whose `data` is not an option list (the
 * tree-select's `readonly CngxTreeNode<T>[]`) as the option-list state
 * `createSelectCore` reads. Every status signal is forwarded by reference;
 * `data`, `hasData` and `isEmpty` read the given flat option list instead,
 * so the core's view, busy and error derivations run unchanged and never
 * see tree-shaped data. The view is rebuilt only when the state identity
 * changes.
 *
 * @internal
 */
export function createOptionsStateView<T>(
  state: Signal<CngxAsyncState<unknown> | null>,
  options: Signal<CngxSelectOptionsInput<T>>,
): Signal<CngxAsyncState<CngxSelectOptionsInput<T>> | null> {
  const isEmpty = computed<boolean>(() => options().length === 0);
  const hasData = computed<boolean>(() => !isEmpty());
  return computed<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(() => {
    const s = state();
    if (!s) {
      return null;
    }
    return {
      status: s.status,
      data: options,
      error: s.error,
      progress: s.progress,
      isLoading: s.isLoading,
      isPending: s.isPending,
      isRefreshing: s.isRefreshing,
      isBusy: s.isBusy,
      isFirstLoad: s.isFirstLoad,
      isEmpty,
      hasData,
      isSettled: s.isSettled,
      lastUpdated: s.lastUpdated,
    };
  });
}
