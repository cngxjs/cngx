import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxBar } from './bar.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxBar],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100">
      <cngx-axis position="bottom" type="band" [domain]="bandDomain()" />
      <cngx-axis position="left" type="linear" [domain]="[0, 10]" />
      <cngx-bar [gap]="gap()" />
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 4, 8]);
  bandDomain = signal<readonly unknown[]>(['a', 'b', 'c', 'd']);
  gap = signal<number>(0);
}

describe('CngxBar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    rects: SVGRectElement[];
  } {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const rects = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGRectElement>('.cngx-bar'),
    );
    return { fixture, rects };
  }

  it('renders one rect per datapoint', () => {
    const { rects } = setup();
    expect(rects.length).toBe(4);
  });

  it('positions bars in evenly spaced slots across the chart width', () => {
    const { rects } = setup();
    const xs = rects.map((r) => Number(r.getAttribute('x')));
    expect(xs).toEqual([0, 50, 100, 150]);
  });

  it('shrinks bar width by the [gap] ratio while keeping the slot center', () => {
    const { fixture, rects: _ } = setup();
    void _;
    fixture.componentInstance.gap.set(0.2);
    fixture.detectChanges();
    const rects2 = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGRectElement>('.cngx-bar'),
    );
    const widths = rects2.map((r) => Number(r.getAttribute('width')));
    expect(widths.every((w) => w === 40)).toBe(true);
    const xs = rects2.map((r) => Number(r.getAttribute('x')));
    expect(xs).toEqual([5, 55, 105, 155]);
  });

  it('reflects data signal changes by re-rendering rect heights', () => {
    const { fixture, rects } = setup();
    const heightBefore = Number(rects[0].getAttribute('height'));
    fixture.componentInstance.data.set([10, 9, 8, 7]);
    fixture.detectChanges();
    const rectsAfter = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGRectElement>('.cngx-bar'),
    );
    const heightAfter = Number(rectsAfter[0].getAttribute('height'));
    expect(heightAfter).not.toBe(heightBefore);
  });
});
