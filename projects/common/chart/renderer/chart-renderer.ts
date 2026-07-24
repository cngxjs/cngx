import { type DestroyRef } from '@angular/core';

import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';

/**
 * Construction dependencies shared by every renderer backend. The
 * renderer reads scales / dimensions through the chart context and
 * schedules its own teardown through the `DestroyRef` - it never injects
 * the concrete `CngxChart` class.
 *
 * @category common/chart/renderer
 */
export interface ChartRendererDeps {
  readonly ctx: CngxChartContext;
  readonly destroyRef: DestroyRef;
}

/**
 * A rendering backend for `<cngx-chart>`. Both backends compose against
 * the same {@link LayerGeometry} surface the layer atoms publish, so a
 * single chart-authoring API drives either one with no consumer change.
 *
 * The SVG backend is a passthrough (layer atoms self-render); the Canvas
 * backend paints the geometries onto a `<canvas>` 2D context.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/chart-renderer.ts
 * @since 0.1.0
 */
export interface CngxChartRenderer {
  /** Which backend this instance is. */
  readonly mode: 'svg' | 'canvas';
  /** Attach to the chart host (insert a `<canvas>`, wire teardown, ...). */
  mount(host: HTMLElement, ctx: CngxChartContext): void;
  /** Paint the current layer geometries. Called on every geometry emission. */
  paint(geometries: readonly LayerGeometry[]): void;
  /** Detach and release resources. */
  destroy(): void;
  /** Drop any cached theme colors (called on layout/theming reflow). Optional. */
  invalidateColorCache?(): void;
}

/**
 * Builds a {@link CngxChartRenderer} for the requested `mode`. The
 * default implementation ({@link createDefaultChartRenderer}) dispatches
 * to the SVG or Canvas backend; consumers override the whole factory via
 * {@link CNGX_CHART_RENDERER_FACTORY} to add a third backend (WebGL, ...)
 * without touching layer atoms.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/chart-renderer.ts
 * @since 0.1.0
 */
export type CngxChartRendererFactory = (
  mode: 'svg' | 'canvas',
  deps: ChartRendererDeps,
) => CngxChartRenderer;
