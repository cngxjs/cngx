import { type DestroyRef, effect, linkedSignal, type Signal, untracked } from '@angular/core';

import { createMediaQuerySignal } from '@cngx/core/utils';

import { type CngxChartContext } from '../chart/chart-context';
import { dimensionsEqual } from '../chart/equal-helpers';
import { type LayerGeometry } from '../layers/chart-layer';
import { type CngxChartRenderer, type CngxChartRendererFactory } from './chart-renderer';

/**
 * Construction dependencies for {@link createChartRendererController}.
 *
 * @category common/chart/renderer
 */
export interface ChartRendererControllerDeps {
  readonly host: HTMLElement;
  readonly ctx: CngxChartContext;
  readonly mode: Signal<'svg' | 'canvas'>;
  readonly geometries: Signal<readonly LayerGeometry[]>;
  readonly factory: CngxChartRendererFactory;
  readonly destroyRef: DestroyRef;
}

/**
 * Handle returned by {@link createChartRendererController}.
 *
 * @category common/chart/renderer
 */
export interface CngxChartRendererController {
  readonly currentMode: Signal<'svg' | 'canvas'>;
  destroy(): void;
}

/**
 * Owns the renderer mount / destroy / paint reactive lifecycle so the
 * chart shell holds no rendering brain. Installs two effects:
 *
 * - **mount** - tracks `mode()`; on change, destroys the previous backend,
 *   builds the new one via `factory`, mounts it, and seeds the first paint.
 * - **paint** - tracks `geometries()`, the (structurally-deduped)
 *   dimensions and the `(forced-colors: active)` /
 *   `(prefers-color-scheme: dark)` media queries; repaints on every
 *   geometry emission and invalidates the backend's color cache when the
 *   dimensions or either media query actually change, so a contrast-theme
 *   or OS colour-scheme switch repaints at once instead of after the next
 *   resize.
 *
 * Both effects wrap their imperative renderer calls in `untracked()` so
 * the renderer's own signal reads never feed back into the effect graph.
 * The dimensions are tracked through a `linkedSignal` guarded by
 * {@link dimensionsEqual}, so a resize observer re-emitting the same
 * width/height literal does not trigger a redundant cache invalidation.
 *
 * Must run in an injection context (the chart shell calls it from a field
 * initialiser / constructor). Ships as a plain `create*` factory the shell
 * calls directly - no DI token, since the only second consumer today is a
 * test double, which injects a fake `factory` through the deps.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/chart-renderer-controller.ts
 * @since 0.1.0
 */
export function createChartRendererController(
  deps: ChartRendererControllerDeps,
): CngxChartRendererController {
  let current: CngxChartRenderer | null = null;

  // Structural-equality tracker: the resize observer re-emits a fresh
  // { width, height } literal every tick; dimensionsEqual short-circuits
  // the redundant re-paints / cache invalidations.
  const dims = linkedSignal(() => deps.ctx.dimensions(), { equal: dimensionsEqual });
  let lastDims = untracked(dims);

  const view = deps.host.ownerDocument.defaultView;
  const forced = createMediaQuerySignal('(forced-colors: active)', deps.destroyRef, view);
  const darkScheme = createMediaQuerySignal('(prefers-color-scheme: dark)', deps.destroyRef, view);
  let lastForced = untracked(forced);
  let lastDark = untracked(darkScheme);

  // Mount effect: rebuild the backend whenever the mode flips, then seed
  // the first paint (the paint effect does not track `mode`, so the fresh
  // backend would otherwise stay blank until the next geometry change).
  effect(() => {
    const mode = deps.mode();
    untracked(() => {
      current?.destroy();
      current = deps.factory(mode, {
        ctx: deps.ctx,
        destroyRef: deps.destroyRef,
        forcedColors: forced,
      });
      current.mount(deps.host, deps.ctx);
      current.paint(deps.geometries());
    });
  });

  // Paint effect: repaint on geometry change; invalidate the color cache
  // only when the deduped dimensions or a palette media query actually
  // changed (a palette flip re-resolves colors like a theming reflow).
  effect(() => {
    const geometries = deps.geometries();
    const nextDims = dims();
    const nextForced = forced();
    const nextDark = darkScheme();
    untracked(() => {
      const paletteChanged = nextForced !== lastForced || nextDark !== lastDark;
      if (nextDims !== lastDims || paletteChanged) {
        lastDims = nextDims;
        lastForced = nextForced;
        lastDark = nextDark;
        current?.invalidateColorCache?.();
      }
      current?.paint(geometries);
    });
  });

  deps.destroyRef.onDestroy(() => current?.destroy());

  return {
    currentMode: deps.mode,
    destroy: () => current?.destroy(),
  };
}
