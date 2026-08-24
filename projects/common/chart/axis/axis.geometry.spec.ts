import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

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
