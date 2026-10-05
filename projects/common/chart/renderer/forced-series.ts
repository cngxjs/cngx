import { type LayerGeometry } from '../layers/chart-layer';

// Forced-colors support for the Canvas backend. Canvas pixels are never
// forced by the browser, so the backend paints the system palette itself.
// Internal: not exported from the public API.

/** @internal The two system colours a forced Canvas paint uses. */
export interface ForcedSystemColors {
  /** `CanvasText` - every mark, stroke and ring. */
  readonly ink: string;
  /** `Canvas` - hatch gaps and hollow-mark interiors. */
  readonly canvas: string;
}

/**
 * @internal Resolve `CanvasText` / `Canvas` to concrete colours through a
 * probe span under `host`. The probe opts out with
 * `forced-color-adjust: none`; without it a forced `color: Canvas` would
 * compute to the forced text colour. Removed right after the read, so the
 * host's DOM is left as it was. Falls back to the keywords when the host
 * resolves nothing (jsdom).
 */
export function resolveSystemColors(host: HTMLElement): ForcedSystemColors {
  const probe = host.ownerDocument.createElement('span');
  probe.style.setProperty('forced-color-adjust', 'none');
  probe.style.display = 'none';
  host.appendChild(probe);
  probe.style.color = 'CanvasText';
  const ink = getComputedStyle(probe).color;
  probe.style.color = 'Canvas';
  const canvas = getComputedStyle(probe).color;
  probe.remove();
  return { ink: ink || 'CanvasText', canvas: canvas || 'Canvas' };
}

/** @internal Position of a series in the legend's four-step forced-colors cycle. */
export type ForcedSeriesStep = 0 | 1 | 2 | 3;

/**
 * @internal Line dash per step: solid, dashed, dotted, dash-dot. Same
 * values as the `stroke-dasharray` in the line layer's forced-colors CSS.
 */
export const FORCED_LINE_DASHES: readonly number[][] = [[], [6, 3], [0.1, 4], [8, 3, 0.1, 3]];

const stepMemo = new WeakMap<readonly LayerGeometry[], readonly (ForcedSeriesStep | null)[]>();

/**
 * @internal The forced-colors step of every geometry, `null` for the kinds
 * outside the cycle. Line, bar and scatter count, area, threshold and band
 * do not - the same rule as the SVG
 * `:nth-child(4n + k of .cngx-chart-series)` selectors. Memoised by the
 * array reference: the chart's geometries array is reference-stable while
 * no layer changes, so a realtime frame allocates nothing here.
 */
export function forcedSeriesSteps(
  geometries: readonly LayerGeometry[],
): readonly (ForcedSeriesStep | null)[] {
  const cached = stepMemo.get(geometries);
  if (cached) {
    return cached;
  }
  let series = 0;
  const steps = geometries.map((g): ForcedSeriesStep | null => {
    const counts = g.kind === 'line' || g.kind === 'bar' || g.kind === 'scatter';
    if (!counts) {
      return null;
    }
    const step = (series % 4) as ForcedSeriesStep;
    series++;
    return step;
  });
  stepMemo.set(geometries, steps);
  return steps;
}
