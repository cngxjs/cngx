import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChartPanel } from './chart-panel.component';
import { CngxChartPanelTitle } from './chart-panel-slots';

// Runs in a real Chromium (the `test-geometry` target). The dashboard-tile
// layout the `@scope (.cngx-chart-panel)` block SETs (chart-panel.component.css):
// the host is a vertical flex column that orders header / body / legend / footer
// explicitly, the header is a wrapping space-between row so the actions never
// crush the title on a narrow tile, and both the heading and the body carry
// `min-inline-size: 0` so a wide SVG chart shrinks instead of overflowing. jsdom
// reports `''` for every one of these reads.

@Component({
  selector: 'cngx-chart-panel-geometry-host',
  standalone: true,
  imports: [CngxChartPanel, CngxChartPanelTitle],
  template: `
    <cngx-chart-panel>
      <h3 cngxChartPanelTitle>Revenue</h3>
      <div class="fake-chart">chart body</div>
    </cngx-chart-panel>
  `,
})
class ChartPanelHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ChartPanelHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-chart-panel');
  if (!host) {
    throw new Error('cngx-chart-panel did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxChartPanel geometry', () => {
  it('stacks the panel regions as a vertical flex column', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'flex-direction')).toBe('column');
    // Body sits after the header in the explicit source-independent order.
    expect(computedValue(query(host, '.cngx-chart-panel__header'), 'order')).toBe('1');
    expect(computedValue(query(host, '.cngx-chart-panel__body'), 'order')).toBe('3');
  });

  it('lays the header out as a wrapping space-between row', () => {
    const host = mount();
    const header = query(host, '.cngx-chart-panel__header');
    expect(computedValue(header, 'display')).toBe('flex');
    expect(computedValue(header, 'justify-content')).toBe('space-between');
    expect(computedValue(header, 'flex-wrap')).toBe('wrap');
  });

  it('lets the heading and body shrink below their intrinsic width', () => {
    // min-inline-size: 0 is what makes a chart in a narrow panel scale instead of
    // forcing the tile wider than its column.
    const host = mount();
    const heading = query(host, '.cngx-chart-panel__heading');
    expect(computedValue(heading, 'display')).toBe('flex');
    expect(computedValue(heading, 'flex-direction')).toBe('column');
    expect(computedValue(heading, 'min-inline-size')).toBe('0px');
    expect(computedValue(query(host, '.cngx-chart-panel__body'), 'min-inline-size')).toBe('0px');
  });
});
