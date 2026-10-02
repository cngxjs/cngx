/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';
import { CngxArea } from './area.component';
import { CngxThreshold } from './threshold.component';
import { CngxLine } from './line.component';

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
  imports: [CngxChart, CngxAxis, CngxArea, CngxLine, CngxThreshold],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-chart class="lines" [data]="[1, 3, 2, 4]" [width]="240" [height]="120" aria-label="lines">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
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
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class SeriesHost {}

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
});

describe('chart series without forced colors', () => {
  it('keeps the author stroke and draws every line solid', () => {
    const root = mount();
    const lines = all(root, '.lines .cngx-line');
    expect(computedValue(lines[1], 'stroke')).toBe('rgb(200, 0, 0)');
    expect(lines.map((l) => computedValue(l, 'stroke-dasharray'))).toEqual(Array(5).fill('none'));
    expect(computedValue(one(root, '.areas .cngx-area'), 'fill')).toBe('rgb(200, 0, 0)');
  });
});
