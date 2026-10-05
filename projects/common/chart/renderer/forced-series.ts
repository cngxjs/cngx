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
  // Lowercase on purpose: CSS keywords are case-insensitive, and the
  // capitalised form reads as copy to the user-facing string guard.
  probe.style.color = 'canvas';
  const canvas = getComputedStyle(probe).color;
  probe.remove();
  return { ink: ink || 'CanvasText', canvas: canvas || 'canvas' };
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

/** @internal The two hatch fills of the forced cycle; `null` where the host cannot build one. */
export interface ForcedHatches {
  /** Step 1: 45deg stripes. */
  readonly diagonal: CanvasPattern | null;
  /** Step 3: 0deg stripes. */
  readonly horizontal: CanvasPattern | null;
}

const NO_HATCHES: ForcedHatches = { diagonal: null, horizontal: null };

/**
 * @internal Build the hatch patterns the SVG chart draws as `<pattern>`
 * defs: a 4px tile with a 2px ink stripe on a Canvas gap (the gap keeps a
 * hatched mark readable where it overlaps another). The tile is drawn at
 * device-pixel size and scaled back through the pattern transform, so the
 * stripes stay crisp on a high-DPR screen instead of being resampled into
 * off-palette greys. Returns nulls when the host lacks `createPattern` or
 * `DOMMatrix`; the caller then fills with ink.
 */
export function createForcedHatches(
  doc: Document,
  target: CanvasRenderingContext2D,
  colors: ForcedSystemColors,
  dpr: number,
): ForcedHatches {
  if (typeof target.createPattern !== 'function' || typeof DOMMatrix !== 'function') {
    return NO_HATCHES;
  }
  const size = Math.max(1, Math.round(4 * dpr));
  const stripe = Math.max(1, Math.round(2 * dpr));
  const tile = doc.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const t = tile.getContext('2d');
  if (!t) {
    return NO_HATCHES;
  }
  t.fillStyle = colors.canvas;
  t.fillRect(0, 0, size, size);
  t.fillStyle = colors.ink;
  t.fillRect(0, 0, size, stripe);

  const back = 4 / size;
  const diagonal = target.createPattern(tile, 'repeat');
  diagonal?.setTransform(new DOMMatrix().scale(back).rotate(45));
  const horizontal = target.createPattern(tile, 'repeat');
  horizontal?.setTransform(new DOMMatrix().scale(back));
  return { diagonal, horizontal };
}
