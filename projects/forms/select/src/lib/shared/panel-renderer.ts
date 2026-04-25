import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';

/**
 * Input bundle given to {@link CngxPanelRendererFactory}. The factory
 * reads the variant's full option list (flattened, filtered, commit-
 * aware — everything {@link /projects/forms/select/src/lib/shared/select-core.ts
 * createSelectCore}.flatOptions already owns) and decides which subset
 * to render in the DOM.
 *
 * @category interactive
 */
export interface PanelRendererInput<T> {
  /**
   * Full flattened option list the variant wants rendered. The default
   * renderer passes this through verbatim; virtualising renderers slice
   * it to the window size of their scroll viewport.
   */
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
}

/**
 * API returned from {@link createIdentityPanelRenderer} and any
 * consumer-supplied {@link CngxPanelRendererFactory}. The panel reads
 * `renderOptions` instead of `flatOptions` directly — the default
 * identity renderer makes this transparent; a virtualising renderer
 * slices the list based on scroll position.
 *
 * @category interactive
 */
export interface PanelRenderer<T> {
  /**
   * The option subset the panel actually renders into the DOM. The
   * identity default returns `flatOptions` verbatim; virtualising
   * implementations return a contiguous window keyed off their scroll
   * position. Structural-equal on length + per-entry identity is
   * sufficient — any option reference change already implies a value
   * change upstream.
   */
  readonly renderOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  /**
   * Optional — total count of renderable options. Useful for ARIA
   * `aria-setsize` when the DOM only holds a window subset. The
   * identity default returns `flatOptions().length`; virtualising
   * implementations also return the full count (never the windowed
   * count) so assistive tech reads "5 of 3000", not "5 of 20".
   */
  readonly totalCount?: Signal<number>;
  /**
   * Optional — spacer + absolute-index metadata the panel reads when
   * a virtualising renderer is wired. Identity renderers leave this
   * undefined; the panel falls back to non-virtualised rendering
   * (no spacer divs, `data-cngx-recycle-index` not set).
   *
   * Virtualising implementations (e.g. {@link /projects/forms/select/src/lib/shared/recycler-panel-renderer.ts
   * createRecyclerPanelRendererFactory}) emit:
   * - `startIndex()` — absolute index of the first rendered item,
   *   so `data-cngx-recycle-index` can be bound as `startIndex + i`
   *   on each option row (the recycler's focus-tracking reads this
   *   attribute via `closest('[data-cngx-recycle-index]')`).
   * - `offsetBefore()` / `offsetAfter()` — pixel heights of the
   *   empty spacer divs before/after the rendered window so the
   *   native scrollbar shows the full scroll extent.
   * - `setsize()` — total item count for `aria-setsize` on each
   *   rendered row (so AT reads "5 of 10000", not "5 of 20"). The
   *   panel computes `aria-posinset` as `startIndex + i + 1` for
   *   each row.
   */
  readonly virtualizer?: {
    readonly startIndex: Signal<number>;
    readonly offsetBefore: Signal<number>;
    readonly offsetAfter: Signal<number>;
    readonly setsize: Signal<number>;
    /**
     * Imperative scroll helper the variant uses to bring an absolute
     * item index into the rendered window — typically invoked when
     * `CngxActiveDescendant`'s `pendingHighlight` fires because the
     * user arrow-navigated past the current window. Recycler-backed
     * renderers forward this to `recycler.scrollToIndex`; bespoke
     * virtualising renderers wire their own scroll strategy.
     */
    readonly scrollToIndex: (index: number) => void;
  };
}

/**
 * Default pass-through renderer: `renderOptions === flatOptions`,
 * `totalCount === flatOptions().length`. Preserves the family's
 * shipped behaviour exactly — every variant renders every option into
 * the DOM. Performs well up to ~500 options; beyond that, a consumer
 * SHOULD wire a virtualising renderer via
 * {@link CNGX_PANEL_RENDERER_FACTORY}.
 *
 * @category interactive
 */
export function createIdentityPanelRenderer<T>(
  input: PanelRendererInput<T>,
): PanelRenderer<T> {
  return {
    renderOptions: input.flatOptions,
    // Identity renderer's total count is always the full list —
    // the component's signal pipeline already deduped structurally.
  };
}

/**
 * Factory-signature type — mirrors {@link createIdentityPanelRenderer}
 * so DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxPanelRendererFactory = <T>(
  input: PanelRendererInput<T>,
) => PanelRenderer<T>;

/**
 * DI token resolving the factory the panel uses to decide which options
 * to render. Defaults to {@link createIdentityPanelRenderer} — every
 * option goes into the DOM. Override app-wide via
 * `providers: [{ provide: CNGX_PANEL_RENDERER_FACTORY, useValue: createVirtualisingRenderer }]`
 * or per-component via `viewProviders` to plug a CDK virtual-scroll /
 * `injectRecycler`-based windowed renderer.
 *
 * **Contract for virtualising renderers.**
 *
 *   1. `renderOptions` MUST be a contiguous slice of `flatOptions` —
 *      non-contiguous slicing breaks the `CngxActiveDescendant`
 *      keyboard-navigation contract (AD assumes ArrowDown lands on
 *      the next element in DOM order).
 *   2. When the user's arrow navigation lands on an option NOT in the
 *      current `renderOptions` window, the renderer is responsible
 *      for extending the window (typically via CDK virtual-scroll's
 *      `scrolledIndexChange`). The panel has no hook to request a
 *      jump — it passively renders whatever `renderOptions` emits.
 *   3. `totalCount` (when provided) populates `aria-setsize` on each
 *      option row. Virtualising renderers MUST return the full count
 *      so AT reads the correct "X of N" position, not the windowed
 *      count.
 *   4. The renderer runs in the variant's injection context and is
 *      expected to be signal-reactive — the panel re-renders whenever
 *      `renderOptions` emits.
 *
 * **Integration plan** (not shipped yet). The library will ship a
 * `connectRecyclerToActiveDescendant` helper alongside
 * `injectRecycler` in `@cngx/common/data` — that helper produces a
 * conforming `CngxPanelRendererFactory` that handles the
 * AD-scroll-into-view boundary cleanly. Until then, this token is the
 * forward-compatible extension point: consumers with custom
 * virtualisation stacks (CDK scroll-strategy, third-party libs, bespoke
 * server-side paging) can wire a conforming factory today and the
 * upgrade to the built-in recycler is a single `useValue` swap.
 *
 * @category interactive
 */
export const CNGX_PANEL_RENDERER_FACTORY =
  new InjectionToken<CngxPanelRendererFactory>('CngxPanelRendererFactory', {
    providedIn: 'root',
    factory: () => createIdentityPanelRenderer,
  });
