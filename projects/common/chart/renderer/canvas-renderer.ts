import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';
import { type ChartRendererDeps, type CngxChartRenderer } from './chart-renderer';

/**
 * @internal Per-kind CSS custom-property fallback chain, resolved when a
 * geometry emits `color: null`. Mirrors each layer atom's SVG cascade
 * (`var(--cngx-<kind>-*, var(--cngx-chart-*, currentColor))`) so a
 * consumer's per-atom theming survives the SVG->Canvas crossover instead
 * of collapsing to the three chart-family colors.
 */
const KIND_VARS: Record<LayerGeometry['kind'], readonly string[]> = {
  line: ['--cngx-line-color', '--cngx-chart-primary'],
  area: ['--cngx-area-fill', '--cngx-chart-primary'],
  bar: ['--cngx-bar-color', '--cngx-chart-primary'],
  scatter: ['--cngx-scatter-color', '--cngx-chart-primary'],
  threshold: ['--cngx-threshold-color', '--cngx-chart-danger'],
  band: ['--cngx-band-color', '--cngx-chart-secondary'],
};

/** @internal */
const DEFAULT_STROKE_WIDTH = 1.5;
/** @internal */
const DEFAULT_AREA_OPACITY = 0.18;
/** @internal */
const DEFAULT_BAND_OPACITY = 0.12;

/**
 * Canvas rendering backend. Mounts a `<canvas>` absolutely positioned
 * over the chart's SVG frame and paints each {@link LayerGeometry} onto
 * its 2D context: `Path2D` stroke/fill for line/area, per-mark loops for
 * bar/scatter, `moveTo`/`lineTo` for threshold, `fillRect` for band.
 *
 * Colors resolve through a closure-local cache: the first `paint()` reads
 * each CSS custom property once via `getComputedStyle(host)`; subsequent
 * paints hit the cache, so the paint hot path performs zero synchronous
 * DOM reads. {@link CngxChartRenderer.invalidateColorCache} clears it -
 * the renderer controller calls it on a `dimensions()` change (a proxy
 * for layout / theming reflow). It never writes the chart context's
 * `renderSvg` gate; the shell owns that.
 *
 * @category common/chart/renderer
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/renderer/canvas-renderer.ts
 * @since 0.1.0
 */
export function createCanvasRenderer(deps: ChartRendererDeps): CngxChartRenderer {
  let canvas: HTMLCanvasElement | null = null;
  let hostEl: HTMLElement | null = null;
  let ctx2d: CanvasRenderingContext2D | null = null;
  let lastW = -1;
  let lastH = -1;
  const colorCache = new Map<string, string>();

  function readVar(name: string): string {
    return hostEl ? getComputedStyle(hostEl).getPropertyValue(name).trim() : '';
  }

  function colorOf(color: string | null, kind: LayerGeometry['kind']): string {
    // An explicit literal color (e.g. [cngxLine] [color]="'#f00'") passes
    // through untouched - no var resolution, no cache.
    if (color !== null && !color.startsWith('--')) {
      return color;
    }
    const key = color ?? `@${kind}`;
    const cached = colorCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    let resolved = 'currentColor';
    if (color !== null) {
      resolved = readVar(color) || 'currentColor';
    } else {
      // Walk the per-atom -> family fallback chain, first hit wins.
      for (const name of KIND_VARS[kind]) {
        const value = readVar(name);
        if (value) {
          resolved = value;
          break;
        }
      }
    }
    colorCache.set(key, resolved);
    return resolved;
  }

  function strokeWidthOf(sw: number | string | null): number {
    if (sw === null) {
      return DEFAULT_STROKE_WIDTH;
    }
    const n = typeof sw === 'number' ? sw : parseFloat(sw);
    return Number.isFinite(n) ? n : DEFAULT_STROKE_WIDTH;
  }

  function sizeCanvas(): void {
    if (!canvas || !ctx2d) {
      return;
    }
    const { width, height } = deps.ctx.dimensions();
    const dpr = globalThis.devicePixelRatio ?? 1;
    const w = Math.max(0, Math.round(width * dpr));
    const h = Math.max(0, Math.round(height * dpr));
    if (w === lastW && h === lastH) {
      return;
    }
    lastW = w;
    lastH = h;
    // Assigning width/height reallocates and clears the bitmap - only when
    // the device-pixel size actually changed. paint() clears each frame via
    // clearRect regardless, so the realtime hot path pays nothing here.
    canvas.width = w;
    canvas.height = h;
    // Draw in logical pixels; the bitmap is scaled for the device.
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function mount(host: HTMLElement): void {
    hostEl = host;
    const el = host.ownerDocument.createElement('canvas');
    el.className = 'cngx-chart__canvas';
    el.setAttribute('aria-hidden', 'true');
    el.style.position = 'absolute';
    el.style.inset = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    host.appendChild(el);
    canvas = el;
    ctx2d = el.getContext('2d');
    sizeCanvas();
    // Teardown is owned by the renderer controller (it destroys on mode
    // flip and on the chart's DestroyRef). Self-registering here would
    // pile up one never-unregistered closure per svg<->canvas flip.
  }

  function paint(geometries: readonly LayerGeometry[]): void {
    const c = ctx2d;
    if (!canvas || !c) {
      return;
    }
    sizeCanvas();
    const { width, height } = deps.ctx.dimensions();
    c.clearRect(0, 0, width, height);
    for (const g of geometries) {
      paintOne(c, g);
    }
  }

  function paintOne(c: CanvasRenderingContext2D, g: LayerGeometry): void {
    switch (g.kind) {
      case 'line': {
        c.strokeStyle = colorOf(g.color, 'line');
        c.lineWidth = strokeWidthOf(g.strokeWidth);
        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.stroke(new Path2D(g.d));
        break;
      }
      case 'area': {
        c.fillStyle = colorOf(g.color, 'area');
        c.globalAlpha = g.opacity ?? DEFAULT_AREA_OPACITY;
        c.fill(new Path2D(g.d));
        c.globalAlpha = 1;
        break;
      }
      case 'bar': {
        for (const r of g.rects) {
          c.fillStyle = colorOf(r.color, 'bar');
          c.fillRect(r.x, r.y, r.w, r.h);
        }
        break;
      }
      case 'scatter': {
        for (const m of g.marks) {
          c.fillStyle = colorOf(m.color, 'scatter');
          c.beginPath();
          c.arc(m.cx, m.cy, m.r, 0, Math.PI * 2);
          c.fill();
        }
        break;
      }
      case 'threshold': {
        c.strokeStyle = colorOf(g.color, 'threshold');
        c.lineWidth = 1;
        c.setLineDash(g.dashed ? [4, 3] : []);
        c.beginPath();
        c.moveTo(g.x1, g.y1);
        c.lineTo(g.x2, g.y2);
        c.stroke();
        c.setLineDash([]);
        break;
      }
      case 'band': {
        c.fillStyle = colorOf(g.color, 'band');
        c.globalAlpha = g.opacity ?? DEFAULT_BAND_OPACITY;
        c.fillRect(g.x, g.y, g.w, g.h);
        c.globalAlpha = 1;
        break;
      }
    }
  }

  function invalidateColorCache(): void {
    colorCache.clear();
  }

  function destroy(): void {
    canvas?.remove();
    canvas = null;
    ctx2d = null;
    hostEl = null;
    lastW = -1;
    lastH = -1;
    colorCache.clear();
  }

  return {
    mode: 'canvas',
    mount: (host: HTMLElement, _ctx: CngxChartContext) => mount(host),
    paint,
    destroy,
    invalidateColorCache,
  };
}
