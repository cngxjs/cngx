import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';

/**
 * Input bundle for {@link CngxPanelRendererFactory}.
 *
 * @category interactive
 */
export interface PanelRendererInput<T> {
  /** Full flattened option list. Identity renderer passes through. */
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
}

/**
 * Renderer surface read by the panel.
 *
 * @category interactive
 */
export interface PanelRenderer<T> {
  /** Subset rendered into the DOM. Identity → `flatOptions` verbatim. */
  readonly renderOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  /** Full count for `aria-setsize`; never the windowed count. */
  readonly totalCount?: Signal<number>;
  /**
   * Virtualisation metadata the panel reads when present:
   * - `startIndex` — absolute index of the first rendered item; bind
   *   `data-cngx-recycle-index = startIndex + i` per row.
   * - `offsetBefore` / `offsetAfter` — spacer-div pixel heights.
   * - `setsize` — total item count for `aria-setsize`.
   * - `scrollToIndex` — invoked by the variant when AD nav exceeds
   *   the rendered window.
   */
  readonly virtualizer?: {
    readonly startIndex: Signal<number>;
    readonly offsetBefore: Signal<number>;
    readonly offsetAfter: Signal<number>;
    readonly setsize: Signal<number>;
    readonly scrollToIndex: (index: number) => void;
  };
}

/**
 * Pass-through renderer: every option enters the DOM. Comfortable to
 * ~500 options; beyond that, wire a virtualising renderer via
 * {@link CNGX_PANEL_RENDERER_FACTORY}.
 *
 * @category interactive
 */
export function createIdentityPanelRenderer<T>(
  input: PanelRendererInput<T>,
): PanelRenderer<T> {
  return {
    renderOptions: input.flatOptions,
  };
}

/**
 * Factory signature for {@link CNGX_PANEL_RENDERER_FACTORY}.
 *
 * @category interactive
 */
export type CngxPanelRendererFactory = <T>(
  input: PanelRendererInput<T>,
) => PanelRenderer<T>;

/**
 * Renderer factory token. Default {@link createIdentityPanelRenderer}.
 *
 * Virtualising renderer contract:
 * 1. `renderOptions` MUST be a contiguous slice — AD assumes ArrowDown
 *    lands on the next DOM-order element.
 * 2. Renderer extends the window when AD nav exceeds it.
 * 3. `totalCount` returns the full count, not the windowed count.
 * 4. Renderer is signal-reactive.
 *
 * @category interactive
 */
export const CNGX_PANEL_RENDERER_FACTORY =
  new InjectionToken<CngxPanelRendererFactory>('CngxPanelRendererFactory', {
    providedIn: 'root',
    factory: () => createIdentityPanelRenderer,
  });
