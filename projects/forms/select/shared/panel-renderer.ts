import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';

/**
 * Option list a composite hands to its panel renderer.
 *
 * The flat composites pass the core's `flatOptions` once at construction;
 * the renderer derives its window from that signal. A consumer meets this
 * shape only when it provides its own renderer through
 * {@link CNGX_PANEL_RENDERER_FACTORY}.
 */
export interface PanelRendererInput<T> {
  /** Full flattened option list. Identity renderer passes through. */
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
}

/**
 * Slice of options the panel renders, plus the window metadata a virtualising
 * renderer adds.
 *
 * Without `virtualizer` the panel renders `renderOptions` as a plain list. A
 * windowing renderer reports the full count through `totalCount` and
 * `virtualizer.setsize`; the panel binds `setsize` as `aria-setsize`, so
 * screen readers announce the real list size. A grouped option list ignores
 * the slice and renders every row.
 */
export interface PanelRenderer<T> {
  /** Subset rendered into the DOM. Identity → `flatOptions` verbatim. */
  readonly renderOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  /** Full count for `aria-setsize`; never the windowed count. */
  readonly totalCount?: Signal<number>;
  /**
   * Virtualisation metadata the panel reads when present:
   * - `startIndex` - absolute index of the first rendered item; bind
   *   `data-cngx-recycle-index = startIndex + i` per row.
   * - `offsetBefore` / `offsetAfter` - spacer-div pixel heights.
   * - `setsize` - total item count for `aria-setsize`.
   * - `rowSizeHint` - representative row height (px); keys the fast-fling
   *   placeholder rhythm to the real option height so its ghost rows line up.
   * - `scrollToIndex` - invoked by the variant when AD nav exceeds
   *   the rendered window.
   */
  readonly virtualizer?: {
    readonly startIndex: Signal<number>;
    readonly offsetBefore: Signal<number>;
    readonly offsetAfter: Signal<number>;
    readonly setsize: Signal<number>;
    readonly rowSizeHint: Signal<number>;
    readonly scrollToIndex: (index: number) => void;
  };
}

/**
 * Pass-through renderer: every option enters the DOM. Comfortable to
 * ~500 options; beyond that, wire a virtualising renderer via
 * {@link CNGX_PANEL_RENDERER_FACTORY}.
 *
 * As the token default it also lets `withVirtualization` window long lists.
 * Wrapping it in a new function counts as an override and turns that off.
 *
 * @example
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_PANEL_RENDERER_FACTORY,
 *     useValue: <T>(input: PanelRendererInput<T>): PanelRenderer<T> =>
 *       createIdentityPanelRenderer(input),
 *   },
 * ];
 * ```
 */
export function createIdentityPanelRenderer<T>(input: PanelRendererInput<T>): PanelRenderer<T> {
  return {
    renderOptions: input.flatOptions,
  };
}

/**
 * Function shape a replacement panel renderer must have.
 *
 * Every flat composite calls it once during construction, in an injection
 * context; `CngxTreeSelect` does not use it. A provided factory always wins
 * over the `withVirtualization` auto-windowing, even when its renderer has no
 * `virtualizer`. Provide it through {@link CNGX_PANEL_RENDERER_FACTORY}.
 */
export type CngxPanelRendererFactory = <T>(input: PanelRendererInput<T>) => PanelRenderer<T>;

/**
 * Renderer factory token. Default {@link createIdentityPanelRenderer}.
 *
 * Virtualising renderer contract:
 * 1. `renderOptions` MUST be a contiguous slice - AD assumes ArrowDown
 *    lands on the next DOM-order element.
 * 2. Renderer extends the window when AD nav exceeds it.
 * 3. `totalCount` returns the full count, not the windowed count.
 * 4. Renderer is signal-reactive.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/panel-renderer.ts
 * @since 0.1.0
 */
export const CNGX_PANEL_RENDERER_FACTORY = new InjectionToken<CngxPanelRendererFactory>(
  'CngxPanelRendererFactory',
  {
    providedIn: 'root',
    factory: () => createIdentityPanelRenderer,
  },
);
