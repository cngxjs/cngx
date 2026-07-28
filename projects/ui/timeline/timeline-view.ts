import { computed, InjectionToken, type Signal } from '@angular/core';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxTimelineFallbackCopy } from './timeline-labels';

/**
 * Everything the template needs to decide what the body shows.
 *
 * @category ui/timeline
 */
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
 * Swap the whole mapping through {@link CNGX_TIMELINE_VIEW_FACTORY} rather
 * than forking the organism - treating `pending` as content, or holding the
 * skeleton through a refresh, is a per-app decision.
 *
 * @category ui/timeline
 * @relatedTo CNGX_TIMELINE_VIEW_FACTORY
 * @since 0.1.0
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

/**
 * The shape {@link CNGX_TIMELINE_VIEW_FACTORY} hands out.
 *
 * @category ui/timeline
 */
export type CngxTimelineViewFactory = (
  state: () => CngxAsyncState<unknown> | undefined,
  isEmpty: () => boolean,
  labels: CngxTimelineFallbackCopy,
) => CngxTimelineView;

/**
 * Swap point for the body-view mapping. Override it to reshape when the
 * timeline shows a skeleton, content, the empty surface or the error
 * surface - enterprise-wide or per component - without forking the organism.
 *
 * The mapping is genuinely per-app: whether a `pending` refetch keeps its
 * rows on screen, whether a background failure surfaces inline or is
 * swallowed until the next settle, and whether an empty result after a
 * filter reads as empty at all are product decisions, not library ones.
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_TIMELINE_VIEW_FACTORY,
 *     useValue: ((state, isEmpty, labels) => {
 *       const base = createTimelineView(state, isEmpty, labels);
 *       // Hold the rows through every refetch, never fall back to placeholders.
 *       return { ...base, activeView: computed(() => (base.activeView() === 'skeleton' && state()?.hasData() ? 'content' : base.activeView())) };
 *     }) satisfies CngxTimelineViewFactory,
 *   },
 * ]
 * ```
 *
 * @category ui/timeline
 * @relatedTo createTimelineView
 * @since 0.1.0
 */
export const CNGX_TIMELINE_VIEW_FACTORY = new InjectionToken<CngxTimelineViewFactory>(
  'CNGX_TIMELINE_VIEW_FACTORY',
  { providedIn: 'root', factory: () => createTimelineView },
);
