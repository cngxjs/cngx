import { computed } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

/**
 * Wraps a *changing* source of async state in a stable
 * {@link CngxAsyncState} façade.
 *
 * A component that receives its state through an `Input` cannot publish that
 * object through `CNGX_STATEFUL` directly: the token is resolved once when a
 * bridge injects it, while the input can be rebound or absent. Capturing the
 * object would hand the bridge a stale state - or `undefined` before the
 * first binding.
 *
 * This returns one object whose every member is a `computed()` that reads the
 * source on each access, so bridges observe transitions of whatever is bound
 * right now. With nothing bound it reports a quiet `idle` state rather than
 * throwing, which is what lets a bridge sit inside a timeline that has not
 * been given a state yet.
 *
 * Contrast the select family, which provides `CNGX_STATEFUL` with
 * `useFactory` over a concrete `commitState` field - no forwarding needed
 * there, because the state is created by the component rather than passed in.
 *
 * ```ts
 * readonly asyncState = createForwardedAsyncState(this.state);
 * ```
 *
 * @category ui/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/timeline/forwarded-async-state.ts
 * @since 0.1.0
 */
export function createForwardedAsyncState<T>(
  source: () => CngxAsyncState<T> | undefined,
): CngxAsyncState<T> {
  return {
    status: computed(() => source()?.status() ?? 'idle'),
    data: computed(() => source()?.data()),
    error: computed(() => source()?.error()),
    progress: computed(() => source()?.progress()),
    isLoading: computed(() => source()?.isLoading() ?? false),
    isPending: computed(() => source()?.isPending() ?? false),
    isRefreshing: computed(() => source()?.isRefreshing() ?? false),
    isBusy: computed(() => source()?.isBusy() ?? false),
    isFirstLoad: computed(() => source()?.isFirstLoad() ?? true),
    isEmpty: computed(() => source()?.isEmpty() ?? true),
    hasData: computed(() => source()?.hasData() ?? false),
    isSettled: computed(() => source()?.isSettled() ?? false),
    lastUpdated: computed(() => source()?.lastUpdated()),
  };
}
