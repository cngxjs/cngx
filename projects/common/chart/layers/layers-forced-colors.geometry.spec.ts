/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxAxis } from '../axis/axis.component';
import { CngxChartLegend } from '../legend/legend.component';
import { CngxChart } from '../chart/chart.component';
import { CngxArea } from './area.component';
import { CngxBand } from './band.component';
import { CngxBar } from './bar.component';
import { CngxThreshold } from './threshold.component';
import { CngxLine } from './line.component';
import { CngxScatter } from './scatter.component';

// Runs in a real Chromium (the `test-geometry` target). Chromium keeps author
// fill and stroke inside SVG under forced colors (preserve-parent-color), so
// the series used to keep their colours while the legend swatches turned into
// patterns. The series now follow the user palette and carry the legend's
// four-step cycle by series index. A threshold between two lines must not
// shift the index.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-chart-series-forced-host',
  standalone: true,
  imports: [
    CngxChart,
    CngxAxis,
    CngxArea,
    CngxBand,
    CngxBar,
    CngxLine,
    CngxScatter,
    CngxThreshold,
    CngxChartLegend,
  ],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-chart class="lines" [data]="[1, 3, 2, 4]" [width]="240" [height]="120" aria-label="lines">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]" [grid]="true" label="Units"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxLine [data]="[2, 4, 3, 5]" [color]="'rgb(200, 0, 0)'"></svg:g>
      <svg:g cngxThreshold [value]="8" [dashed]="true"></svg:g>
      <svg:g cngxLine [data]="[3, 5, 4, 6]"></svg:g>
      <svg:g cngxLine [data]="[4, 6, 5, 7]"></svg:g>
      <svg:g cngxLine [data]="[5, 7, 6, 8]" [points]="'always'"></svg:g>
    </cngx-chart>
    <cngx-chart class="areas" [data]="[1, 3, 2, 4]" [width]="240" [height]="120" aria-label="area">
      <svg:g cngxArea [color]="'rgb(200, 0, 0)'" [points]="'always'"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxLine [data]="[2, 4, 3, 5]"></svg:g>
    </cngx-chart>
    <cngx-chart class="bars" [data]="[8, 6, 9]" [width]="240" [height]="120" aria-label="bars">
      <svg:g cngxAxis position="bottom" type="band" [domain]="['a', 'b', 'c']"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxBar></svg:g>
      <svg:g cngxBar [data]="[6, 5, 7]" [color]="'rgb(200, 0, 0)'"></svg:g>
      <svg:g cngxThreshold [value]="9"></svg:g>
      <svg:g cngxBar [data]="[4, 3, 5]"></svg:g>
      <svg:g cngxBar [data]="[2, 2, 3]"></svg:g>
      <svg:g cngxBar [data]="[1, 1, 1]"></svg:g>
    </cngx-chart>
    <cngx-chart class="points" [data]="[1, 3, 2]" [width]="240" [height]="120" aria-label="points">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxScatter [x]="index" [y]="value" [radius]="5"></svg:g>
      <svg:g cngxLine [data]="[2, 4, 3]"></svg:g>
      <svg:g cngxScatter [data]="[3, 5, 4]" [x]="index" [y]="value" [radius]="5" [color]="'rgb(200, 0, 0)'"></svg:g>
      <svg:g cngxScatter [data]="[4, 6, 5]" [x]="index" [y]="value" [radius]="5"></svg:g>
    </cngx-chart>
    <cngx-chart class="marks" [data]="[1, 3, 2]" [width]="240" [height]="120" aria-label="marks">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxBand [from]="2" [to]="4" label="zone" [color]="'rgb(200, 0, 0)'"></svg:g>
      <svg:g cngxThreshold [value]="6" [label]="'limit'" [dashed]="true" [color]="'rgb(200, 0, 0)'"></svg:g>
    </cngx-chart>
    <div class="paired">
      <cngx-chart [data]="[4, 6, 5]" [width]="240" [height]="120" aria-label="paired">
        <svg:g cngxAxis position="bottom" type="band" [domain]="['a', 'b', 'c']"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]" [grid]="true"></svg:g>
        <svg:g cngxBand [from]="1" [to]="2"></svg:g>
        <svg:g cngxBar></svg:g>
        <svg:g cngxArea [data]="[6, 7, 6]" [xAccessor]="band"></svg:g>
        <svg:g cngxLine [data]="[6, 7, 6]" [xAccessor]="band"></svg:g>
        <svg:g cngxThreshold [value]="9"></svg:g>
        <svg:g cngxBar [data]="[2, 3, 2]"></svg:g>
        <svg:g cngxLine [data]="[8, 8, 9]" [xAccessor]="band"></svg:g>
        <svg:g cngxLine [data]="[1, 2, 1]" [xAccessor]="band"></svg:g>
      </cngx-chart>
      <cngx-chart-legend [items]="legend" />
    </div>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class SeriesHost {
  protected readonly index = (_: unknown, i: number): number => i;
  protected readonly value = (d: unknown): number => Number(d);
  protected readonly band = (_: unknown, i: number): string => ['a', 'b', 'c'][i];
  protected readonly legend = ['bars', 'trend', 'target', 'peak', 'floor'].map((label) => ({
    label,
    color: 'rgb(200, 0, 0)',
  }));
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SeriesHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('chart series under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string =>
    computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  describe('lines', () => {
    it('stroke CanvasText, the inline [color] included', async () => {
      const root = await mountForced();
      const lines = all(root, '.lines .cngx-line');
      expect(lines).toHaveLength(5);
      for (const line of lines) {
        expect(computedValue(line, 'stroke')).toBe(probe(root, 'canvastext'));
      }
      for (const point of all(root, '.lines .cngx-line__point')) {
        expect(computedValue(point, 'fill')).toBe(probe(root, 'canvastext'));
      }
    });

    it('cycle solid, dashed, dotted, dash-dot by series index, skipping the threshold', async () => {
      const root = await mountForced();
      const dashes = all(root, '.lines .cngx-line').map((l) => computedValue(l, 'stroke-dasharray'));
      expect(dashes).toEqual(['none', '6px, 3px', '0.1px, 4px', '8px, 3px, 0.1px, 3px', 'none']);
    });
  });

  describe('areas', () => {
    it('fill a CanvasText wash at their own opacity, the inline [color] included', async () => {
      const root = await mountForced();
      const area = one(root, '.areas .cngx-area');
      expect(computedValue(area, 'fill')).toBe(probe(root, 'canvastext'));
      expect(computedValue(area, 'fill-opacity')).toBe('0.18');
      expect(computedValue(one(root, '.areas .cngx-area__point'), 'fill')).toBe(probe(root, 'canvastext'));
    });

    it('do not count as a series: the lines after an area start the cycle', async () => {
      const root = await mountForced();
      const dashes = all(root, '.areas .cngx-line').map((l) => computedValue(l, 'stroke-dasharray'));
      expect(dashes).toEqual(['none', '6px, 3px']);
    });
  });

  describe('bars', () => {
    const barsOf = (root: HTMLElement, layer: number): Element[] =>
      all(all(root, '.bars .cngx-chart-series')[layer], '.cngx-bar');
    const firstBars = (root: HTMLElement): Element[] =>
      all(root, '.bars .cngx-chart-series').map((g) => one(g, '.cngx-bar'));

    it('cycle solid, 45deg hatch, hollow, 0deg hatch by series index, skipping the threshold', async () => {
      const root = await mountForced();
      const ink = probe(root, 'canvastext');
      const bars = firstBars(root);
      expect(bars).toHaveLength(5);

      expect(computedValue(bars[0], 'fill')).toBe(ink);
      expect(computedValue(bars[1], 'fill')).toMatch(/^url\(".*-diagonal"\)$/);
      expect(computedValue(bars[1], 'stroke')).toBe(ink);
      expect(computedValue(bars[2], 'fill')).toBe(probe(root, 'canvas'));
      expect(computedValue(bars[2], 'stroke')).toBe(ink);
      expect(computedValue(bars[2], 'stroke-width')).toBe('1.5px');
      expect(computedValue(bars[3], 'fill')).toMatch(/^url\(".*-horizontal"\)$/);
      expect(computedValue(bars[4], 'fill')).toBe(ink);
      const second = barsOf(root, 1);
      expect(second).toHaveLength(3);
      expect(new Set(second.map((b) => computedValue(b, 'fill')))).toEqual(new Set([computedValue(bars[1], 'fill')]));
    });

    it('reference hatch patterns of their own chart, with ink stripes on a Canvas gap', async () => {
      const root = await mountForced();
      const chart = one(root, '.bars');
      const bars = firstBars(root);
      for (const bar of [bars[1], bars[3]]) {
        const id = /url\("#(.+)"\)/.exec(computedValue(bar, 'fill'))?.[1] ?? '';
        const pattern = chart.querySelector(`svg > defs > pattern[id="${id}"]`);
        expect(pattern).not.toBeNull();
        expect(computedValue(one(pattern as Element, '.cngx-chart__hatch-ink'), 'fill')).toBe(probe(root, 'canvastext'));
        expect(computedValue(one(pattern as Element, '.cngx-chart__hatch-gap'), 'fill')).toBe(probe(root, 'canvas'));
      }
      const otherIds = all(root, '.lines svg > defs > pattern').map((p) => p.id);
      const ownIds = all(chart, 'svg > defs > pattern').map((p) => p.id);
      expect(ownIds).toHaveLength(2);
      expect(otherIds.some((id) => ownIds.includes(id))).toBe(false);
    });
  });

  describe('scatter', () => {
    it('cycles with lines and bars by series index: solid, hatch, hollow, hatch', async () => {
      const root = await mountForced();
      const ink = probe(root, 'canvastext');
      const series = all(root, '.points .cngx-chart-series');
      expect(series).toHaveLength(4);
      const dot = (i: number): Element => one(series[i], '.cngx-scatter');

      expect(computedValue(dot(0), 'fill')).toBe(ink);
      expect(computedValue(one(series[1], '.cngx-line'), 'stroke-dasharray')).toBe('6px, 3px');
      expect(computedValue(dot(2), 'fill')).toBe(probe(root, 'canvas'));
      expect(computedValue(dot(2), 'stroke')).toBe(ink);
      expect(computedValue(dot(3), 'fill')).toMatch(/^url\(".*-horizontal"\)$/);
      expect(computedValue(dot(3), 'stroke')).toBe(ink);
      expect(new Set(all(series[2], '.cngx-scatter').map((d) => computedValue(d, 'fill'))).size).toBe(1);
    });
  });

  describe('thresholds and bands', () => {
    it('follow the palette: CanvasText line, wash and labels, dash and opacity kept', async () => {
      const root = await mountForced();
      const ink = probe(root, 'canvastext');
      const line = one(root, '.marks .cngx-threshold__line');
      expect(computedValue(line, 'stroke')).toBe(ink);
      expect(computedValue(line, 'stroke-dasharray')).toBe('4px, 3px');
      expect(computedValue(one(root, '.marks .cngx-threshold__label'), 'fill')).toBe(ink);
      const band = one(root, '.marks .cngx-band__rect');
      expect(computedValue(band, 'fill')).toBe(ink);
      expect(computedValue(band, 'fill-opacity')).toBe('0.12');
      expect(computedValue(one(root, '.marks .cngx-band__label'), 'fill')).toBe(ink);
    });
  });

  describe('axes', () => {
    it('paint rules and labels CanvasText and the grid CanvasText at reduced opacity', async () => {
      const root = await mountForced();
      const ink = probe(root, 'canvastext');
      for (const sel of ['.cngx-axis__line', '.cngx-axis__tick-line']) {
        expect(computedValue(one(root, `.lines ${sel}`), 'stroke')).toBe(ink);
      }
      for (const sel of ['.cngx-axis__tick-label', '.cngx-axis__axis-label']) {
        expect(computedValue(one(root, `.lines ${sel}`), 'fill')).toBe(ink);
      }
      const grid = one(root, '.lines .cngx-axis__grid-line');
      expect(computedValue(grid, 'stroke')).toBe(ink);
      expect(computedValue(grid, 'stroke-opacity')).toBe('0.35');
    });
  });

  describe('legend and series', () => {
    // A step is the position in the four-step cycle, read from the paint.
    const swatchStep = (el: Element, canvas: string): number => {
      const image = computedValue(el, 'background-image');
      if (image.includes('45deg')) {
        return 2;
      }
      if (image.includes('repeating-linear-gradient')) {
        return 4;
      }
      return computedValue(el, 'background-color') === canvas ? 3 : 1;
    };
    const seriesStep = (layer: Element, canvas: string): number => {
      const line = layer.querySelector('.cngx-line');
      if (line) {
        const dashes = ['none', '6px, 3px', '0.1px, 4px', '8px, 3px, 0.1px, 3px'];
        return dashes.indexOf(computedValue(line, 'stroke-dasharray')) + 1;
      }
      const fill = computedValue(one(layer, '.cngx-bar, .cngx-scatter'), 'fill');
      if (fill.includes('-diagonal')) {
        return 2;
      }
      if (fill.includes('-horizontal')) {
        return 4;
      }
      return fill === canvas ? 3 : 1;
    };

    it('give legend entry N and series N the same step, whatever the series kind', async () => {
      const root = await mountForced();
      const canvas = probe(root, 'canvas');
      const swatches = all(root, '.paired .cngx-chart-legend__swatch').map((s) => swatchStep(s, canvas));
      const series = all(root, '.paired .cngx-chart-series').map((g) => seriesStep(g, canvas));
      expect(swatches).toEqual([1, 2, 3, 4, 1]);
      expect(series).toEqual(swatches);
    });
  });
});

describe('chart series without forced colors', () => {
  it('keeps the author stroke and draws every line solid', () => {
    const root = mount();
    const lines = all(root, '.lines .cngx-line');
    expect(computedValue(lines[1], 'stroke')).toBe('rgb(200, 0, 0)');
    expect(lines.map((l) => computedValue(l, 'stroke-dasharray'))).toEqual(Array(5).fill('none'));
    expect(computedValue(one(root, '.areas .cngx-area'), 'fill')).toBe('rgb(200, 0, 0)');
    const bars = all(root, '.bars .cngx-chart-series').map((g) => one(g, '.cngx-bar'));
    expect(computedValue(bars[1], 'fill')).toBe('rgb(200, 0, 0)');
    expect(bars.map((b) => computedValue(b, 'fill')).some((f) => f.startsWith('url('))).toBe(false);
    expect(computedValue(bars[2], 'stroke')).toBe('none');
    expect(computedValue(one(root, '.marks .cngx-threshold__line'), 'stroke')).toBe('rgb(200, 0, 0)');
    expect(computedValue(one(root, '.marks .cngx-band__rect'), 'fill')).toBe('rgb(200, 0, 0)');
    expect(computedValue(one(root, '.lines .cngx-axis__grid-line'), 'stroke-opacity')).toBe('0.6');
    const dots = all(root, '.points .cngx-scatter');
    expect(computedValue(dots[3], 'fill')).toBe('rgb(200, 0, 0)');
    expect(dots.some((d) => computedValue(d, 'fill').startsWith('url('))).toBe(false);
  });
});
