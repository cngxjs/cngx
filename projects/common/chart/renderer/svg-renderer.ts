import { type ChartRendererDeps, type CngxChartRenderer } from './chart-renderer';

/**
 * SVG passthrough renderer. Layer atoms render their own `<svg:path>` /
 * `<svg:rect>` / `<svg:circle>`, gated by the chart shell's `renderSvg`
 * computed, so this backend has nothing to do: every method is a no-op.
 * It never writes back to the chart context - `renderSvg` ownership stays
 * in the chart shell as the single source of truth.
 *
 * @param _deps unused; kept for factory signature symmetry with
 *   {@link createCanvasRenderer}.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/svg-renderer.ts
 * @since 0.1.0
 */
export function createSvgRenderer(_deps: ChartRendererDeps): CngxChartRenderer {
  const noop = (): void => undefined;
  return {
    mode: 'svg',
    mount: noop,
    paint: noop,
    destroy: noop,
    invalidateColorCache: noop,
  };
}
