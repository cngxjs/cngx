import { signal, type DestroyRef, type WritableSignal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CngxChartContext } from '../chart/chart-context';
import { type LayerGeometry } from '../layers/chart-layer';
import { createCanvasRenderer } from './canvas-renderer';
import { type ChartRendererDeps, type CngxChartRenderer } from './chart-renderer';
import { forcedSeriesSteps } from './forced-series';

const INK = 'rgb(1, 2, 3)';
const PAPER = 'rgb(250, 251, 252)';
const AUTHOR = 'rgb(200, 0, 0)';

interface Recorded {
  readonly op: string;
  readonly args?: readonly unknown[];
  readonly value?: unknown;
}

const METHODS = [
  'clearRect',
  'stroke',
  'strokeRect',
  'fill',
  'fillRect',
  'beginPath',
  'moveTo',
  'lineTo',
  'arc',
  'setLineDash',
  'setTransform',
] as const;

const PROPS = ['strokeStyle', 'fillStyle', 'lineWidth', 'globalAlpha', 'lineJoin', 'lineCap'];

/** Fake 2D context that records every method call and style assignment in order. */
function makeRecorder(): { ctx: CanvasRenderingContext2D; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const state: Record<string, unknown> = {
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    lineJoin: '',
    lineCap: '',
  };
  const ctx: Record<string, unknown> = {};
  for (const m of METHODS) {
    ctx[m] = vi.fn((...args: unknown[]) => {
      calls.push({ op: m, args });
    });
  }
  for (const p of PROPS) {
    Object.defineProperty(ctx, p, {
      get: () => state[p],
      set: (value: unknown) => {
        state[p] = value;
        calls.push({ op: `set:${p}`, value });
      },
    });
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const LINE: LayerGeometry = {
  kind: 'line',
  d: 'M 0 0 L 10 10',
  color: '#00ff00',
  strokeWidth: null,
  fill: 'none',
  points: [{ cx: 5, cy: 5 }],
};
const AREA: LayerGeometry = {
  kind: 'area',
  d: 'M 0 0 L 10 10 Z',
  color: null,
  strokeWidth: null,
  fill: null,
  opacity: 0.4,
};
const AREA_VAR_OPACITY: LayerGeometry = { ...AREA, opacity: null };
const BAR: LayerGeometry = {
  kind: 'bar',
  rects: [{ x: 0, y: 0, w: 5, h: 10, color: '#0000ff' }],
};
const SCATTER: LayerGeometry = {
  kind: 'scatter',
  marks: [{ cx: 3, cy: 3, r: 2, color: null }],
};
const THRESHOLD: LayerGeometry = {
  kind: 'threshold',
  x1: 0,
  y1: 5,
  x2: 100,
  y2: 5,
  color: null,
  dashed: true,
} as LayerGeometry;
const BAND: LayerGeometry = {
  kind: 'band',
  x: 0,
  y: 0,
  w: 100,
  h: 10,
  color: null,
  opacity: null,
} as LayerGeometry;

let rec: ReturnType<typeof makeRecorder>;
let forced: WritableSignal<boolean>;
let gcs: ReturnType<typeof vi.spyOn>;

function deps(): ChartRendererDeps {
  const ctx = {
    dimensions: signal({ width: 100, height: 50 }),
    renderSvg: signal(true),
  } as unknown as CngxChartContext;
  const destroyRef = { onDestroy: vi.fn() } as unknown as DestroyRef;
  return { ctx, destroyRef, forcedColors: forced };
}

function mounted(): CngxChartRenderer {
  const d = deps();
  const renderer = createCanvasRenderer(d);
  renderer.mount(document.createElement('div'), d.ctx);
  rec.calls.length = 0;
  return renderer;
}

function styles(op: 'set:strokeStyle' | 'set:fillStyle'): unknown[] {
  return rec.calls.filter((c) => c.op === op).map((c) => c.value);
}

/** Mount, paint once, return the recorded calls of that paint. */
function paintTrace(geometries: readonly LayerGeometry[]): Recorded[] {
  const renderer = mounted();
  renderer.paint(geometries);
  return rec.calls.map((c) => ({ ...c }));
}

beforeEach(() => {
  rec = makeRecorder();
  forced = signal(true);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(rec.ctx);
  class FakePath2D {
    constructor(readonly d?: string) {}
  }
  vi.stubGlobal('Path2D', FakePath2D);
  // Probe span: CanvasText / Canvas resolve to the fixture palette; host
  // custom properties resolve to an author colour and an opacity token.
  gcs = vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (el: Element) =>
      ({
        color: (el as HTMLElement).style.color === 'canvas' ? PAPER : INK,
        getPropertyValue: (name: string) => {
          if (name === '--cngx-area-opacity') {
            return '0.25';
          }
          return name.startsWith('--cngx-') && name.endsWith('-opacity') ? '' : AUTHOR;
        },
      }) as unknown as CSSStyleDeclaration,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createCanvasRenderer under forced colors', () => {
  it('paints every stroke in the probed ink and every fill in ink or canvas', () => {
    const renderer = mounted();
    renderer.paint([LINE, AREA, BAR, SCATTER, THRESHOLD, BAND]);

    const strokes = styles('set:strokeStyle');
    const fills = styles('set:fillStyle');
    expect(strokes.length).toBeGreaterThan(0);
    expect(fills.length).toBeGreaterThan(0);
    for (const value of strokes) {
      expect(value).toBe(INK);
    }
    for (const value of fills) {
      expect([INK, PAPER]).toContain(value);
    }
  });

  it('ignores a literal [color] on line and bar', () => {
    const renderer = mounted();
    renderer.paint([LINE, BAR]);
    expect(styles('set:strokeStyle')).not.toContain('#00ff00');
    expect(styles('set:fillStyle')).not.toContain('#0000ff');
  });

  it('keeps the area opacity from the input, then from the token', () => {
    const renderer = mounted();
    renderer.paint([AREA]);
    expect(rec.calls.find((c) => c.op === 'set:globalAlpha')?.value).toBe(0.4);

    rec.calls.length = 0;
    renderer.paint([AREA_VAR_OPACITY]);
    expect(rec.calls.find((c) => c.op === 'set:globalAlpha')?.value).toBe(0.25);
  });

  it('keeps the threshold dash', () => {
    const renderer = mounted();
    renderer.paint([THRESHOLD]);
    const dashes = rec.calls.filter((c) => c.op === 'setLineDash').map((c) => c.args?.[0]);
    expect(dashes[0]).toEqual([4, 3]);
  });

  it('paints exactly as before when the signal reads false', () => {
    const fixture = [LINE, AREA, BAR, SCATTER, THRESHOLD, BAND];
    forced.set(false);
    const normal = paintTrace(fixture);

    // The same paint with no forcedColors in the deps at all: the pre-forced baseline.
    rec = makeRecorder();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(rec.ctx);
    const d = deps();
    const baseline = createCanvasRenderer({ ctx: d.ctx, destroyRef: d.destroyRef });
    baseline.mount(document.createElement('div'), d.ctx);
    rec.calls.length = 0;
    baseline.paint(fixture);

    expect(normal).toEqual(rec.calls);
    expect(styles('set:fillStyle')).toContain('#0000ff');
  });

  it('probes the palette once and reads no style between paint 2 and paint 10', () => {
    const renderer = mounted();
    renderer.paint([LINE, BAR]);
    renderer.paint([LINE, BAR]);
    const afterSecond = gcs.mock.calls.length;
    for (let i = 3; i <= 10; i++) {
      renderer.paint([LINE, BAR]);
    }
    expect(gcs.mock.calls.length).toBe(afterSecond);
  });

  it('re-probes the palette after invalidateColorCache', () => {
    const renderer = mounted();
    renderer.paint([LINE]);
    const afterFirst = gcs.mock.calls.length;
    renderer.invalidateColorCache?.();
    renderer.paint([LINE]);
    expect(gcs.mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it('leaves no probe element in the host', () => {
    const d = deps();
    const renderer = createCanvasRenderer(d);
    const host = document.createElement('div');
    renderer.mount(host, d.ctx);
    renderer.paint([LINE]);
    expect(host.querySelector('span')).toBeNull();
  });
});

describe('createCanvasRenderer forced-colors line dashes', () => {
  const PLAIN_LINE: LayerGeometry = { ...LINE, points: undefined } as LayerGeometry;

  /** The dash set right before each line stroke (a stroke with a Path2D argument). */
  function lineDashes(): unknown[] {
    const out: unknown[] = [];
    rec.calls.forEach((c, i) => {
      const next = rec.calls[i + 1];
      if (c.op === 'setLineDash' && next?.op === 'stroke' && next.args?.length) {
        out.push(c.args?.[0]);
      }
    });
    return out;
  }

  it('walks the legend cycle per line, skipping area and threshold', () => {
    const renderer = mounted();
    renderer.paint([PLAIN_LINE, PLAIN_LINE, AREA, PLAIN_LINE, THRESHOLD, PLAIN_LINE, PLAIN_LINE]);
    expect(lineDashes()).toEqual([[], [6, 3], [0.1, 4], [8, 3, 0.1, 3], []]);
  });

  it('counts bars and scatter in the line step', () => {
    const renderer = mounted();
    renderer.paint([BAR, SCATTER, PLAIN_LINE]);
    expect(lineDashes()).toEqual([[0.1, 4]]);
  });

  it('resets the dash right after each line stroke', () => {
    const renderer = mounted();
    renderer.paint([PLAIN_LINE, PLAIN_LINE]);
    rec.calls.forEach((c, i) => {
      if (c.op === 'stroke' && c.args?.length) {
        expect(rec.calls[i + 1]).toEqual({ op: 'setLineDash', args: [[]] });
      }
    });
  });

  it('sets no line dash in normal mode', () => {
    forced.set(false);
    const renderer = mounted();
    renderer.paint([PLAIN_LINE, PLAIN_LINE]);
    expect(rec.calls.some((c) => c.op === 'setLineDash')).toBe(false);
  });

  it('returns the identical steps array for the same geometries array', () => {
    const geometries = [PLAIN_LINE, AREA, BAR];
    const first = forcedSeriesSteps(geometries);
    expect(forcedSeriesSteps(geometries)).toBe(first);
    expect(first).toEqual([0, null, 1]);
    expect(forcedSeriesSteps([...geometries])).not.toBe(first);
  });
});

describe('createCanvasRenderer forced-colors bar and point patterns', () => {
  interface FakePattern {
    readonly id: number;
    readonly setTransform: ReturnType<typeof vi.fn>;
  }

  class FakeDOMMatrix {
    readonly ops: Array<[string, number]> = [];
    scale(k: number): this {
      this.ops.push(['scale', k]);
      return this;
    }
    rotate(deg: number): this {
      this.ops.push(['rotate', deg]);
      return this;
    }
  }

  let patterns: FakePattern[];
  let tile: ReturnType<typeof makeRecorder>;

  /**
   * jsdom has no createPattern / DOMMatrix. Install both, and hand the
   * hatch tile canvas its own recorder so its stripe fillRects stay out of
   * the main recorded calls.
   */
  function installHatchStubs(): void {
    patterns = [];
    tile = makeRecorder();
    (rec.ctx as unknown as Record<string, unknown>)['createPattern'] = vi.fn(() => {
      const p: FakePattern = { id: patterns.length, setTransform: vi.fn() };
      patterns.push(p);
      return p;
    });
    vi.stubGlobal('DOMMatrix', FakeDOMMatrix);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      return this.className === 'cngx-chart__canvas' ? rec.ctx : tile.ctx;
    } as unknown as HTMLCanvasElement['getContext']);
  }

  beforeEach(() => installHatchStubs());

  it('maps four bar series onto solid, diagonal hatch, hollow, horizontal hatch', () => {
    const renderer = mounted();
    renderer.paint([BAR, BAR, BAR, BAR]);

    expect(styles('set:fillStyle')).toEqual([INK, patterns[0], PAPER, patterns[1]]);
    expect(rec.calls.filter((c) => c.op === 'strokeRect')).toHaveLength(3);
    expect(rec.calls.filter((c) => c.op === 'set:lineWidth').map((c) => c.value)).toEqual([
      1, 1.5, 1,
    ]);
    for (const value of styles('set:strokeStyle')) {
      expect(value).toBe(INK);
    }
  });

  it('maps four scatter series the same way, ringing the marks with a stroke', () => {
    const renderer = mounted();
    renderer.paint([SCATTER, SCATTER, SCATTER, SCATTER]);

    expect(styles('set:fillStyle')).toEqual([INK, patterns[0], PAPER, patterns[1]]);
    expect(rec.calls.filter((c) => c.op === 'stroke')).toHaveLength(3);
  });

  it('builds a device-pixel tile and scales the patterns back, the diagonal rotated 45deg', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const renderer = mounted();
    renderer.paint([BAR, BAR]);

    const tileFills = tile.calls.filter((c) => c.op === 'fillRect').map((c) => c.args);
    expect(tileFills).toEqual([
      [0, 0, 8, 8],
      [0, 0, 8, 4],
    ]);
    expect(tile.calls.filter((c) => c.op === 'set:fillStyle').map((c) => c.value)).toEqual([
      PAPER,
      INK,
    ]);
    const [diagonal, horizontal] = patterns;
    const diagonalOps = (diagonal.setTransform.mock.calls[0][0] as FakeDOMMatrix).ops;
    const horizontalOps = (horizontal.setTransform.mock.calls[0][0] as FakeDOMMatrix).ops;
    expect(diagonalOps).toEqual([
      ['scale', 0.5],
      ['rotate', 45],
    ]);
    expect(horizontalOps).toEqual([['scale', 0.5]]);
  });

  it('builds the hatches once across paints and again after invalidateColorCache', () => {
    const renderer = mounted();
    renderer.paint([BAR, BAR]);
    renderer.paint([BAR, BAR]);
    expect(patterns).toHaveLength(2);

    renderer.invalidateColorCache?.();
    renderer.paint([BAR, BAR]);
    expect(patterns).toHaveLength(4);
  });

  it('falls back to an ink fill when the host cannot build a pattern', () => {
    vi.stubGlobal('DOMMatrix', undefined);
    const renderer = mounted();
    renderer.paint([BAR, BAR]);
    expect(styles('set:fillStyle')).toEqual([INK, INK]);
  });

  it('keeps the author fill per rect in normal mode', () => {
    forced.set(false);
    const renderer = mounted();
    renderer.paint([BAR, BAR]);
    expect(styles('set:fillStyle')).toEqual(['#0000ff', '#0000ff']);
    expect(patterns).toHaveLength(0);
    expect(rec.calls.some((c) => c.op === 'strokeRect')).toBe(false);
  });
});
