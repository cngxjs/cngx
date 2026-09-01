import { computed } from '@angular/core';
import { buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Overlay the quick-create commit machine onto the primary commit surface:
 * create `pending`/`error` win while active, everything else (data included)
 * stays on the primary machine. The status counterpart of the `isCommitting`
 * OR the action composites already expose - a `CNGX_STATEFUL` consumer sees
 * a quick-create in flight without caring which controller runs it.
 *
 * A settled create (`success`) does NOT win: create controllers stay settled
 * until the next begin, so a sticky success would mask later toggle commits.
 *
 * @internal
 */
export function mergeCommitState<TData>(
  primary: CngxAsyncState<TData>,
  create: CngxAsyncState<unknown>,
): CngxAsyncState<TData> {
  return buildAsyncStateView<TData>({
    status: computed(() => {
      const s = create.status();
      return s === 'pending' || s === 'error' ? s : primary.status();
    }),
    data: primary.data,
    error: computed(() => (create.status() === 'error' ? create.error() : primary.error())),
    progress: primary.progress,
    isFirstLoad: primary.isFirstLoad,
    lastUpdated: primary.lastUpdated,
  });
}
