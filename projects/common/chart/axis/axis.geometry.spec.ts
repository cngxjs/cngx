import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxAxis } from './axis.component';
import { type CngxAxisPosition } from './axis-position';
import { CngxChart } from '../chart/chart.component';

// Runs in a real Chromium (the `test-geometry` target). Chromium ships a native
// ResizeObserver, and the chart drives its plot area from the [width]/[height]
// inputs, so no mock is needed here. Mounted under an RTL root so the axis tick
// label - a numeric run - resolves the shared `--cngx-chart-numeric-bidi` token
// to `unicode-bidi: isolate`. jsdom reports `''` for the read.

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100">
      <svg:g cngxAxis [position]="position()" [domain]="[0, 100]"></svg:g>
    </cngx-chart>
  `,
})
class AxisHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  position = signal<CngxAxisPosition>('bottom');
}

let mountedRoot: HTMLElement | null = null;

function mount(): SVGTextElement {
  const fixture = TestBed.createComponent(AxisHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const label = mountedRoot.querySelector('.cngx-axis__tick-label');
  if (!label) {
    throw new Error('cngx-axis tick label did not render');
  }
  return label as unknown as SVGTextElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.removeProperty('--cngx-chart-numeric-bidi');
});

describe('CngxChart numeric labels isolate under dir=rtl', () => {
  it('resolves --cngx-chart-numeric-bidi to isolate on the axis tick label', () => {
    document.documentElement.dir = 'rtl';
    const label = mount();
    expect(computedValue(label, 'unicode-bidi')).toBe('isolate');
  });

  it('lets a consumer opt out via --cngx-chart-numeric-bidi', () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.style.setProperty('--cngx-chart-numeric-bidi', 'normal');
    const label = mount();
    expect(computedValue(label, 'unicode-bidi')).toBe('normal');
  });
});

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis],
  template: `
    <cngx-chart [data]="[1, 2, 3]" [width]="300" [height]="200" [style]="chartStyle()">
      <svg:g cngxAxis position="left" [domain]="[0, 100]" [label]="title()"></svg:g>
      <svg:g cngxAxis position="bottom" [domain]="[0, 100]"></svg:g>
    </cngx-chart>
  `,
})
class GutterHost {
  chartStyle = signal('');
  title = signal<string | null>(null);
}

describe('CngxAxis gutter follows the rendered font size', () => {
  // Tick labels 0, 25, 50, 75, 100: the widest carries 3 characters.
  // left  = ceil(TICK_LENGTH 5 + LABEL_OFFSET 4 + 3 x size x CHAR_ADVANCE_RATIO 0.65)
  // bottom = ceil(5 + 4 + size x LINE_BOX_RATIO 1.5)
  // title (left) = ceil(AXIS_LABEL_OFFSET_BLOCK 36 + titleSize x 1.5)
  async function settle(
    style: string,
    title: string | null = null,
  ): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<GutterHost>>;
    left: CngxAxis;
    bottom: CngxAxis;
  }> {
    const fixture = TestBed.createComponent(GutterHost);
    fixture.componentInstance.chartStyle.set(style);
    fixture.componentInstance.title.set(title);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    await fixture.whenStable();
    const [left, bottom] = fixture.debugElement
      .queryAll(By.directive(CngxAxis))
      .map((d) => d.injector.get(CngxAxis));
    return { fixture, left, bottom };
  }

  it('keeps the default arithmetic at the default font size', async () => {
    const { left, bottom } = await settle('');
    expect(left.reservation()).toBe(Math.ceil(9 + 3 * 11 * 0.65));
    expect(bottom.reservation()).toBe(Math.ceil(9 + 11 * 1.5));
  });

  it('sizes the gutter for a restyled --cngx-axis-font-size', async () => {
    const { left, bottom } = await settle('--cngx-axis-font-size: 22px');
    expect(left.reservation()).toBe(Math.ceil(9 + 3 * 22 * 0.65));
    expect(bottom.reservation()).toBe(Math.ceil(9 + 22 * 1.5));
  });

  it('resolves a relative font size to the px the label renders at', async () => {
    const { left } = await settle('font-size: 10px; --cngx-axis-font-size: 2em');
    expect(left.reservation()).toBe(Math.ceil(9 + 3 * 20 * 0.65));
  });

  it('sizes the title room for a restyled --cngx-axis-axis-label-font-size', async () => {
    const { left } = await settle('--cngx-axis-axis-label-font-size: 20px', 'Units');
    expect(left.reservation()).toBe(Math.ceil(36 + 20 * 1.5));
  });

  it('settles: a further render reads no font size again', async () => {
    const { fixture } = await settle('--cngx-axis-font-size: 22px');
    const gcs = vi.spyOn(window, 'getComputedStyle');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(gcs).not.toHaveBeenCalled();
    gcs.mockRestore();
  });
});
