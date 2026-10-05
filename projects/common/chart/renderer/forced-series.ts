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

/** @internal Reads the forced system palette without touching the DOM. */
export interface SystemColorProbe {
  /** Resolve CanvasText / Canvas from the probe's current computed style. */
  read(): ForcedSystemColors;
  /** Detach the probe from its host. */
  remove(): void;
}

/**
 * @internal Mount a hidden probe under `host` that resolves `CanvasText` /
 * `Canvas` to concrete colours. Two child spans carry the keywords and opt
 * out with `forced-color-adjust: none`; without it a forced `color: Canvas`
 * would compute to the forced text colour. The probe lives as long as the
 * renderer, so a re-read on a palette flip is two style reads and never a
 * host mutation inside `paint()`. Falls back to the keywords when the host
 * resolves nothing (jsdom).
 */
export function createSystemColorProbe(host: HTMLElement): SystemColorProbe {
  const doc = host.ownerDocument;
  const root = doc.createElement('span');
  root.className = 'cngx-chart__palette-probe';
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  const swatch = (keyword: string): HTMLElement => {
    const el = doc.createElement('span');
    el.style.setProperty('forced-color-adjust', 'none');
    el.style.color = keyword;
    root.appendChild(el);
    return el;
  };
  const ink = swatch('CanvasText');
  // Lowercase on purpose: CSS keywords are case-insensitive, and the
  // capitalised form reads as copy to the user-facing string guard.
  const canvas = swatch('canvas');
  host.appendChild(root);
  return {
    read: () => ({
      ink: getComputedStyle(ink).color || 'CanvasText',
      canvas: getComputedStyle(canvas).color || 'canvas',
    }),
    remove: () => root.remove(),
  };
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
 * array reference: the chart keeps the same geometries array while no
 * layer emits a new geometry, so repaints without data (resize, DPR or
 * palette flip) reuse the steps. A streaming chart gets a new array on
 * every data tick and recomputes one small array per frame.
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
 * 0deg hatch maps one tile pixel to one device pixel and stays pure ink
 * and canvas on a high-DPR screen. The 45deg hatch is rotated and therefore
 * resampled; its stripe edges blend ink into canvas, as the SVG pattern's
 * do. Returns nulls when the host lacks `createPattern` or `DOMMatrix`; the
 * caller then fills with ink.
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
