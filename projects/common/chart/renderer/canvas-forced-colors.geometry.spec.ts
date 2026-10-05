/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';
import { CngxArea } from '../layers/area.component';
import { CngxBar } from '../layers/bar.component';
import { CngxLine } from '../layers/line.component';
import { CngxScatter } from '../layers/scatter.component';
import { CngxThreshold } from '../layers/threshold.component';
import { provideChartRenderer, withChartRendererThreshold } from './renderer-factory';

// Runs in a real Chromium (the `test-geometry` target). Canvas pixels are
// never forced and computed styles do not see them, so the Canvas backend's
// forced-colors cycle is confirmed by sampling pixels and pinned against the
// SVG backend's computed styles for the same charts. The cycle tables live
// twice (layer CSS and forced-series.ts); this spec is the drift guard.

const SCHEMES = ['light', 'dark'] as const;
const AUTHOR = 'rgb(200, 0, 0)';
/** Alpha a stroke pixel reaches on its strongest row; an area wash stays below. */
const STROKE_ALPHA = 100;

type Step = 'solid' | 'diagonal' | 'hollow' | 'horizontal';
type Dash = 'solid' | 'dashed' | 'dotted' | 'dash-dot';
type Rgb = readonly [number, number, number];

@Component({
  selector: 'cngx-canvas-forced-host',
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxArea, CngxBar, CngxLine, CngxScatter, CngxThreshold],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-chart class="bars" [data]="[8, 0, 0, 0]" [width]="240" [height]="120" aria-label="bars">
      <svg:g cngxAxis position="bottom" type="band" [domain]="['a', 'b', 'c', 'd']"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxBar></svg:g>
      <svg:g cngxArea [data]="[1, 1, 1, 1]"></svg:g>
      <svg:g cngxBar [data]="[0, 8, 0, 0]" [color]="author"></svg:g>
      <svg:g cngxThreshold [value]="9"></svg:g>
      <svg:g cngxBar [data]="[0, 0, 8, 0]"></svg:g>
      <svg:g cngxBar [data]="[0, 0, 0, 8]"></svg:g>
    </cngx-chart>
    <cngx-chart class="lines" [data]="[3, 3, 3, 3]" [width]="240" [height]="120" aria-label="lines">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 3]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 12]"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxLine [data]="[5, 5, 5, 5]" [color]="author"></svg:g>
      <svg:g cngxArea [data]="[1, 1, 1, 1]"></svg:g>
      <svg:g cngxLine [data]="[7, 7, 7, 7]"></svg:g>
      <svg:g cngxThreshold [value]="11" [dashed]="true"></svg:g>
      <svg:g cngxLine [data]="[9, 9, 9, 9]"></svg:g>
    </cngx-chart>
    <cngx-chart class="points" [data]="[5]" [width]="240" [height]="120" aria-label="points">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 4]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxScatter [x]="xs[0]" [y]="value" [radius]="9"></svg:g>
      <svg:g cngxScatter [x]="xs[1]" [y]="value" [radius]="9" [color]="author"></svg:g>
      <svg:g cngxScatter [x]="xs[2]" [y]="value" [radius]="9"></svg:g>
      <svg:g cngxScatter [x]="xs[3]" [y]="value" [radius]="9"></svg:g>
    </cngx-chart>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText; forced-color-adjust: none"></span>
    <span class="probe-canvas" style="color: Canvas; forced-color-adjust: none"></span>
  `,
})
class CanvasForcedHost {
  protected readonly author = AUTHOR;
  protected readonly xs = [0.5, 1.5, 2.5, 3.5].map((n) => (): number => n);
  protected readonly value = (d: unknown): number => Number(d);
}

let mountedRoot: HTMLElement | null = null;

async function mount(canvas: boolean): Promise<HTMLElement> {
  if (canvas) {
    TestBed.configureTestingModule({
      providers: [provideChartRenderer(withChartRendererThreshold(0))],
    });
  }
  const fixture = TestBed.createComponent(CanvasForcedHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  return mountedRoot;
}

function one(root: ParentNode, selector: string): Element {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function all(root: ParentNode, selector: string): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

function parseRgb(value: string): Rgb {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value);
  if (!m) {
    throw new Error(`not an rgb colour: ${value}`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** The painted bitmap of one chart's Canvas backend, in device pixels. */
interface Bitmap {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

function bitmapOf(root: HTMLElement, chart: string): Bitmap {
  const canvas = one(root, `.${chart} canvas.cngx-chart__canvas`) as HTMLCanvasElement;
  const c = canvas.getContext('2d');
  if (!c) {
    throw new Error('no 2d context');
  }
  const img = c.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: canvas.width, height: canvas.height, dpr: canvas.width / 240 };
}

function px(b: Bitmap, x: number, y: number): readonly [number, number, number, number] {
  const i = (Math.round(y) * b.width + Math.round(x)) * 4;
  return [b.data[i], b.data[i + 1], b.data[i + 2], b.data[i + 3]];
}

function near(p: readonly number[], c: Rgb, tolerance = 48): boolean {
  return (
    Math.abs(p[0] - c[0]) <= tolerance &&
    Math.abs(p[1] - c[1]) <= tolerance &&
    Math.abs(p[2] - c[2]) <= tolerance
  );
}

/** Distance of a pixel from the ink-canvas segment: 0 for any antialiased mix of the two. */
function offPalette(p: readonly number[], ink: Rgb, paper: Rgb): number {
  const d = [ink[0] - paper[0], ink[1] - paper[1], ink[2] - paper[2]];
  const v = [p[0] - paper[0], p[1] - paper[1], p[2] - paper[2]];
  const len = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const t =
    len === 0 ? 0 : Math.min(1, Math.max(0, (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / len));
  return Math.hypot(v[0] - t * d[0], v[1] - t * d[1], v[2] - t * d[2]);
}

/** Horizontal runs of opaque pixels along device row `y`. */
function runsOnRow(b: Bitmap, y: number, minAlpha = 160): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let x = 0; x <= b.width; x++) {
    const on = x < b.width && px(b, x, y)[3] >= minAlpha;
    if (on && start < 0) {
      start = x;
    }
    if (!on && start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }
  return runs;
}

/** Classify a filled mark from the pixels of an interior box and its left edge. */
function classifyMark(
  b: Bitmap,
  run: [number, number],
  cy: number,
  half: number,
  ink: Rgb,
  paper: Rgb,
): Step {
  const inset = Math.ceil(3 * b.dpr);
  const x0 = run[0] + inset;
  const x1 = run[1] - inset;
  let inkCount = 0;
  let paperCount = 0;
  let rowsUniform = true;
  for (let y = cy - half; y <= cy + half; y++) {
    const first = px(b, x0, y);
    for (let x = x0; x <= x1; x++) {
      const p = px(b, x, y);
      inkCount += near(p, ink) ? 1 : 0;
      paperCount += near(p, paper) ? 1 : 0;
      if (
        Math.abs(p[0] - first[0]) > 8 ||
        Math.abs(p[1] - first[1]) > 8 ||
        Math.abs(p[2] - first[2]) > 8
      ) {
        rowsUniform = false;
      }
    }
  }
  if (paperCount === 0) {
    return 'solid';
  }
  if (inkCount === 0) {
    expect(near(px(b, run[0], cy), ink, 96)).toBe(true);
    return 'hollow';
  }
  return rowsUniform ? 'horizontal' : 'diagonal';
}

/** Classify a horizontal line by the opaque runs along its row. */
function classifyDash(runs: Array<[number, number]>): Dash {
  if (runs.length === 1) {
    return 'solid';
  }
  const lengths = runs.slice(1, -1).map(([a, z]) => z - a + 1);
  const longest = Math.max(...lengths);
  const shortest = Math.min(...lengths);
  if (longest <= 3) {
    return 'dotted';
  }
  return shortest >= 4 ? 'dashed' : 'dash-dot';
}

/**
 * Rows of a bitmap that carry a line stroke, top to bottom, one per stroke.
 * A 1.5px stroke straddles two or three device rows, so consecutive covered
 * rows form a band and the band's strongest row stands for it. A band whose
 * pixels stay faint is an area wash, not a stroke.
 */
function strokeRows(b: Bitmap): number[] {
  const rows: number[] = [];
  let bandRows: number[] = [];
  const weight = (y: number): { covered: number; alphaSum: number; alphaMax: number } => {
    let covered = 0;
    let alphaSum = 0;
    let alphaMax = 0;
    for (let x = 0; x < b.width; x++) {
      const a = px(b, x, y)[3];
      covered += a > 0 ? 1 : 0;
      alphaSum += a;
      alphaMax = Math.max(alphaMax, a);
    }
    return { covered, alphaSum, alphaMax };
  };
  const flush = (): void => {
    const strongest = bandRows.reduce(
      (best, y) => (best < 0 || weight(y).alphaSum > weight(best).alphaSum ? y : best),
      -1,
    );
    if (strongest >= 0 && Math.max(...bandRows.map((y) => weight(y).alphaMax)) >= STROKE_ALPHA) {
      rows.push(strongest);
    }
    bandRows = [];
  };
  for (let y = 0; y < b.height; y++) {
    if (weight(y).covered > b.width / 4) {
      bandRows.push(y);
    } else {
      flush();
    }
  }
  flush();
  return rows;
}

function svgStep(fill: string, ink: string, paper: string): Step | string {
  if (fill === ink) {
    return 'solid';
  }
  if (fill === paper) {
    return 'hollow';
  }
  if (/-diagonal"\)$/.test(fill)) {
    return 'diagonal';
  }
  return /-horizontal"\)$/.test(fill) ? 'horizontal' : fill;
}

const SVG_DASHES: Record<string, Dash> = {
  none: 'solid',
  '6px, 3px': 'dashed',
  '0.1px, 4px': 'dotted',
  '8px, 3px, 0.1px, 3px': 'dash-dot',
};

const CYCLE: Step[] = ['solid', 'diagonal', 'hollow', 'horizontal'];
const DASH_CYCLE: Dash[] = ['solid', 'dashed', 'dotted', 'dash-dot'];

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('canvas backend under forced colors, %s', (scheme) => {
  async function mountForced(canvas: boolean): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount(canvas);
  }

  const palette = (
    root: HTMLElement,
  ): { ink: Rgb; paper: Rgb; inkCss: string; paperCss: string } => {
    const inkCss = computedValue(one(root, '.probe-canvastext'), 'color');
    const paperCss = computedValue(one(root, '.probe-canvas'), 'color');
    return { ink: parseRgb(inkCss), paper: parseRgb(paperCss), inkCss, paperCss };
  };

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced(true);
    expect(computedValue(one(root, '.plain'), 'color')).toBe(palette(root).inkCss);
  });

  it('paints every opaque mark pixel in ink, canvas or a mix of the two', async () => {
    const root = await mountForced(true);
    const { ink, paper } = palette(root);
    for (const chart of ['bars', 'lines', 'points']) {
      const b = bitmapOf(root, chart);
      let opaque = 0;
      for (let i = 0; i < b.data.length; i += 4) {
        if (b.data[i + 3] < 200) {
          continue;
        }
        opaque++;
        expect(offPalette([b.data[i], b.data[i + 1], b.data[i + 2]], ink, paper)).toBeLessThan(40);
      }
      expect(opaque).toBeGreaterThan(0);
    }
  });

  it('bars: the canvas cycle matches the SVG cycle, area and threshold skipped', async () => {
    const svgRoot = await mountForced(false);
    const svgPalette = palette(svgRoot);
    const svgSteps = all(svgRoot, '.bars .cngx-chart-series').map((g) =>
      svgStep(computedValue(one(g, '.cngx-bar'), 'fill'), svgPalette.inkCss, svgPalette.paperCss),
    );
    svgRoot.remove();
    TestBed.resetTestingModule();

    const root = await mountForced(true);
    const { ink, paper } = palette(root);
    const b = bitmapOf(root, 'bars');
    const cy = Math.round(b.height * 0.55);
    const runs = runsOnRow(b, cy);
    expect(runs).toHaveLength(4);
    const canvasSteps = runs.map((run) =>
      classifyMark(b, run, cy, Math.round(8 * b.dpr), ink, paper),
    );

    expect(svgSteps).toEqual(CYCLE);
    expect(canvasSteps).toEqual(svgSteps);
  });

  it('scatter: the canvas cycle matches the bar cycle', async () => {
    const root = await mountForced(true);
    const { ink, paper } = palette(root);
    const b = bitmapOf(root, 'points');
    const cy = strokeRowsCentre(b);
    const runs = runsOnRow(b, cy);
    expect(runs).toHaveLength(4);
    const steps = runs.map((run) => classifyMark(b, run, cy, Math.round(3 * b.dpr), ink, paper));
    expect(steps).toEqual(CYCLE);
  });

  it('lines: the canvas dash matches the SVG dash per series, area and threshold skipped', async () => {
    const svgRoot = await mountForced(false);
    const svgDashes = all(svgRoot, '.lines .cngx-line').map(
      (l) => SVG_DASHES[computedValue(l, 'stroke-dasharray')] ?? 'unknown',
    );
    svgRoot.remove();
    TestBed.resetTestingModule();

    const root = await mountForced(true);
    const b = bitmapOf(root, 'lines');
    // Top to bottom: threshold (11), then the lines at 9, 7, 5, 3 - series 3, 2, 1, 0.
    const rows = strokeRows(b);
    expect(rows).toHaveLength(5);
    const canvasDashes = rows
      .slice(1)
      .map((y) => classifyDash(runsOnRow(b, y, STROKE_ALPHA)))
      .reverse();

    expect(svgDashes).toEqual(DASH_CYCLE);
    expect(canvasDashes).toEqual(svgDashes);
  });
});

/** Row through the centre of the scatter dots: the widest opaque row. */
function strokeRowsCentre(b: Bitmap): number {
  let best = 0;
  let bestCovered = -1;
  for (let y = 0; y < b.height; y++) {
    const covered = runsOnRow(b, y).reduce((sum, [a, z]) => sum + z - a + 1, 0);
    if (covered > bestCovered) {
      bestCovered = covered;
      best = y;
    }
  }
  return best;
}

describe('canvas backend in normal mode', () => {
  it('keeps the author colour of a [color] bar', async () => {
    const root = await mount(true);
    const b = bitmapOf(root, 'bars');
    const cy = Math.round(b.height * 0.55);
    const runs = runsOnRow(b, cy);
    expect(runs).toHaveLength(4);
    const [a, z] = runs[1];
    expect(near(px(b, (a + z) / 2, cy), parseRgb(AUTHOR), 4)).toBe(true);
  });
});
