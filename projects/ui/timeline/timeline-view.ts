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
 * - **Busy with an empty screen.** The lookup table resolves a non-first-load
 *   `loading` or `pending` to `content`; with no rows that renders nothing at
 *   all, so it is treated as a load instead. `refreshing` keeps its tail.
 * - **First-load busy over seed rows.** The lookup table resolves a first
 *   load to `skeleton` unconditionally, but `[items]` documents seed rows as
 *   a legitimate companion to a bound state - rows that exist are painted,
 *   never hidden behind placeholders. `aria-busy` still marks the list.
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
    const view = resolveAsyncView(bound.status(), bound.isFirstLoad(), empty);
    // A first load with seed rows on screen paints the rows: `[items]`
    // documents seed-plus-state, and a skeleton over existing content would
    // hide it. The busy window still reaches AT through `aria-busy`.
    if (view === 'skeleton' && !empty) {
      return 'content';
    }
    // `loading` and `pending` that are not a first load resolve to `content`,
    // and with nothing to render that is a blank, silent region: no rows, no
    // tail, nothing announced. Work in flight with an empty screen is a load.
    // `refreshing` is deliberately excluded - it already renders its tail and
    // announces itself, so it is communicated, just sparse.
    const silentlyBusy = empty && bound.isBusy() && !bound.isRefreshing();
    return view === 'content' && silentlyBusy ? 'skeleton' : view;
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
      const view = activeView();
      if (view === 'skeleton') {
        return labels.loading;
      }
      // The built-in error surface carries its own role="alert", but a bound
      // *cngxTimelineError replaces that markup wholesale. Announcing here
      // means the failure reaches AT whether or not the slot is bound.
      if (view === 'error' || view === 'content+error') {
        return labels.errorFallback;
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
