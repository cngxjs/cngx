import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';
import { type ChartRendererDeps, type CngxChartRenderer } from './chart-renderer';

/** @internal Default CSS custom property per layer kind when geometry.color is null. */
const KIND_VARS: Record<LayerGeometry['kind'], string> = {
  line: '--cngx-chart-primary',
  area: '--cngx-chart-primary',
  bar: '--cngx-chart-primary',
  scatter: '--cngx-chart-primary',
  threshold: '--cngx-chart-danger',
  band: '--cngx-chart-secondary',
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
  const colorCache = new Map<string, string>();

  function resolveColor(name: string): string {
    if (!name.startsWith('--')) {
      return name;
    }
    const cached = colorCache.get(name);
    if (cached !== undefined) {
      return cached;
    }
    const raw = hostEl ? getComputedStyle(hostEl).getPropertyValue(name).trim() : '';
    const resolved = raw || 'currentColor';
    colorCache.set(name, resolved);
    return resolved;
  }

  function colorOf(color: string | null, kind: LayerGeometry['kind']): string {
    return resolveColor(color ?? KIND_VARS[kind]);
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
    canvas.width = Math.max(0, Math.round(width * dpr));
    canvas.height = Math.max(0, Math.round(height * dpr));
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
