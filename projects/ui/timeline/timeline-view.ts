import { computed, type Signal } from '@angular/core';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxTimelineFallbackCopy } from './timeline-labels';

/** Everything the template needs to decide what the body shows. @internal */
export interface CngxTimelineView {
  readonly activeView: Signal<AsyncView>;
  readonly showsContent: Signal<boolean>;
  readonly refreshing: Signal<boolean>;
  readonly ariaBusy: Signal<'true' | null>;
  readonly announcement: Signal<string>;
}

/**
 * Derives the whole body switch from one bound state. No second state
 * machine, no boolean fallback inputs - every branch is a `computed()` over
 * `resolveAsyncView`, the same lookup table the rest of cngx switches on.
 *
 * Two cases the lookup table does not cover on its own:
 *
 * - **No state bound.** The timeline is then a plain list over `[items]`,
 *   but an empty one still has to reach the empty surface; otherwise
 *   `*cngxTimelineEmpty` would be unreachable on the synchronous path.
 * - **The announcement.** Only `loading` and `refreshing` have anything to
 *   say, and the string is empty otherwise so the live region stays in the
 *   DOM while staying silent.
 *
 * @internal
 */
export function createTimelineView(
  state: () => CngxAsyncState<unknown> | undefined,
  isEmpty: () => boolean,
  labels: CngxTimelineFallbackCopy,
): CngxTimelineView {
  const activeView = computed<AsyncView>(() => {
    const empty = isEmpty();
    const bound = state();
    if (!bound) {
      return empty ? 'empty' : 'content';
    }
    return resolveAsyncView(bound.status(), bound.isFirstLoad(), empty);
  });

  const showsContent = computed(
    () => activeView() === 'content' || activeView() === 'content+error',
  );
  const refreshing = computed(() => showsContent() && (state()?.isRefreshing() ?? false));

  return {
    activeView,
    showsContent,
    refreshing,
    ariaBusy: computed(() => (state()?.isBusy() ? 'true' : null)),
    announcement: computed(() => {
      if (activeView() === 'skeleton') {
        return labels.loading;
      }
      return refreshing() ? labels.refreshing : '';
    }),
  };
}
