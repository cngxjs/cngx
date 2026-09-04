import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChart } from './chart.component';

// Runs in a real Chromium (the `test-geometry` target), which is the only
// place an @property registration is observable: jsdom ignores the at-rule
// entirely. The regression this guards - `--cngx-chart-aspect-ratio`
// registered with `inherits: false` - makes a :root override reset to the
// initial value at every element boundary, so the responsive chart never
// sees it while every unregistered token override keeps working.

@Component({
  standalone: true,
  imports: [CngxChart],
  template: `
    <div style="width: 500px">
      <cngx-chart [data]="data()" data-testid="chart" />
    </div>
  `,
})
class ResponsiveHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
}

let mountedRoot: HTMLElement | null = null;

function mountChart(): HTMLElement {
  const fixture = TestBed.createComponent(ResponsiveHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot.querySelector('[data-testid="chart"]') as HTMLElement;
}

function ratioOf(el: Element): number {
  const [w, h] = computedValue(el, 'aspect-ratio')
    .split('/')
    .map((part) => Number(part.trim()));
  return w / h;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.style.removeProperty('--cngx-chart-aspect-ratio');
});

describe('CngxChart --cngx-chart-aspect-ratio registration', () => {
  it('resolves the registered default 5 / 2 on the responsive host', () => {
    const chart = mountChart();
    expect(chart.classList.contains('cngx-chart--responsive')).toBe(true);
    expect(ratioOf(chart)).toBeCloseTo(5 / 2, 5);
  });

  it('inherits a :root override down to the chart host', () => {
    document.documentElement.style.setProperty('--cngx-chart-aspect-ratio', '16 / 9');
    const chart = mountChart();
    expect(ratioOf(chart)).toBeCloseTo(16 / 9, 5);
  });
});
