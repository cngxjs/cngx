import { signal, type DestroyRef, type WritableSignal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';
import { createCanvasRenderer } from './canvas-renderer';
import { type ChartRendererDeps } from './chart-renderer';

interface Ctx2dMock {
  clearRect: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  globalAlpha: number;
  lineJoin: string;
  lineCap: string;
}

function makeCtx2d(): Ctx2dMock {
  return {
    clearRect: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    lineJoin: '',
    lineCap: '',
  };
}

const LINE_GEOM: LayerGeometry = {
  kind: 'line',
  d: 'M 0 0 L 10 10',
  color: null,
  strokeWidth: null,
  fill: 'none',
};
const BAR_GEOM: LayerGeometry = {
  kind: 'bar',
  rects: [{ x: 0, y: 0, w: 5, h: 10, color: null }],
};

let ctx2d: Ctx2dMock;
let dims: WritableSignal<{ width: number; height: number }>;

function deps(): ChartRendererDeps {
  const ctx = { dimensions: dims, renderSvg: signal(true) } as unknown as CngxChartContext;
  const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
  return { ctx, destroyRef };
}

const DPR = globalThis.devicePixelRatio ?? 1;

beforeEach(() => {
  ctx2d = makeCtx2d();
  dims = signal({ width: 100, height: 50 });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx2d as unknown as CanvasRenderingContext2D,
  );
  class FakePath2D {
    constructor(readonly d?: string) {}
  }
  vi.stubGlobal('Path2D', FakePath2D);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createCanvasRenderer', () => {
  it('inserts a canvas sized to dimensions x devicePixelRatio on mount', () => {
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.width).toBe(Math.round(100 * DPR));
    expect(canvas?.height).toBe(Math.round(50 * DPR));
  });

  it('paints line geometry via stroke and bar geometry via fillRect', () => {
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);

    renderer.paint([LINE_GEOM]);
    expect(ctx2d.stroke).toHaveBeenCalled();

    renderer.paint([BAR_GEOM]);
    expect(ctx2d.fillRect).toHaveBeenCalled();
  });

  it('resizes the bitmap when dimensions change', () => {
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);

    dims.set({ width: 200, height: 120 });
    renderer.paint([LINE_GEOM]);

    const canvas = host.querySelector('canvas');
    expect(canvas?.width).toBe(Math.round(200 * DPR));
    expect(canvas?.height).toBe(Math.round(120 * DPR));
  });

  it('does not self-register teardown on the deps DestroyRef (controller owns it)', () => {
    const d = deps();
    const renderer = createCanvasRenderer(d);
    renderer.mount(document.createElement('div'), d.ctx);
    expect(d.destroyRef.onDestroy as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('removes the canvas on destroy', () => {
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);
    expect(host.querySelector('canvas')).not.toBeNull();

    renderer.destroy();
    expect(host.querySelector('canvas')).toBeNull();
  });

  it('resolves colors once and caches across paints, re-reads after invalidateColorCache', () => {
    const gcs = vi.spyOn(window, 'getComputedStyle');
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);

    renderer.paint([LINE_GEOM]);
    const afterFirst = gcs.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0);

    renderer.paint([LINE_GEOM]);
    renderer.paint([LINE_GEOM]);
    expect(gcs.mock.calls.length).toBe(afterFirst); // cached, no fresh reads

    renderer.invalidateColorCache?.();
    renderer.paint([LINE_GEOM]);
    expect(gcs.mock.calls.length).toBeGreaterThan(afterFirst); // re-read
  });

  it('walks the per-atom var chain before the family var (theming parity)', () => {
    const names: string[] = [];
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (n: string) => {
        names.push(n);
        return '';
      },
    } as unknown as CSSStyleDeclaration);
    const renderer = createCanvasRenderer(deps());
    const host = document.createElement('div');
    renderer.mount(host, deps().ctx);

    renderer.paint([BAR_GEOM]);
    expect(names).toContain('--cngx-bar-color');
    expect(names).toContain('--cngx-chart-primary');
    expect(names.indexOf('--cngx-bar-color')).toBeLessThan(names.indexOf('--cngx-chart-primary'));
  });

  it('never exposes a writable seat on ctx.renderSvg', () => {
    const d = deps();
    const renderer = createCanvasRenderer(d);
    const host = document.createElement('div');
    renderer.mount(host, d.ctx);
    renderer.paint([LINE_GEOM]);

    expect(typeof d.ctx.renderSvg).toBe('function');
    expect(d.ctx.renderSvg()).toBe(true);
    expect((renderer as unknown as Record<string, unknown>)['renderSvg']).toBeUndefined();
  });
});
