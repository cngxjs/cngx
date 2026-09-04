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
      <svg:g cngxAxis position="bottom" type="band" [domain]="bandDomain()"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxBar [gap]="gap()"></svg:g>
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

  it('positions bars in evenly spaced slots across the plot width', () => {
    const { rects } = setup();
    // The band axis reserves 26 on block-end and 4 of label overhang on
    // each inline side; the left axis reserves 31. Plot is x 31..196,
    // so four slots of 41.25 start at the plot edge, not the box edge.
    const xs = rects.map((r) => Number(r.getAttribute('x')));
    expect(xs).toEqual([31, 72.25, 113.5, 154.75]);
  });

  it('starts the first bar on the plot edge and ends the last one there', () => {
    // The regression this guards: bars slotted against ctx.dimensions()
    // while their y values came from a scale ranging over the plot, so
    // they drifted left of the ticks that label them and off any line
    // layer sharing the same axis.
    const { rects } = setup();
    const first = Number(rects[0].getAttribute('x'));
    const last = Number(rects[3].getAttribute('x')) + Number(rects[3].getAttribute('width'));
    expect(first).toBe(31);
    expect(last).toBe(196);
  });

  it('renders nothing once the plot collapses below its own inset', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxBar],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="20" [height]="100">
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxBar></svg:g>
        </cngx-chart>
      `,
    })
    class CollapsedHost {}
    TestBed.configureTestingModule({ imports: [CollapsedHost] });
    const fixture = TestBed.createComponent(CollapsedHost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-bar').length).toBe(0);
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
    expect(widths.every((w) => w === 33)).toBe(true);
    const xs = rects2.map((r) => Number(r.getAttribute('x')));
    expect(xs).toEqual([35.125, 76.375, 117.625, 158.875]);
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

describe('CngxBar [color] parity', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('binds [color] onto the SVG mark like CngxLine does', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxBar],
      template: `
        <cngx-chart [data]="data" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="band" [domain]="['a', 'b', 'c']"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxBar [color]="'rebeccapurple'"></svg:g>
        </cngx-chart>
      `,
    })
    class ColorHost {
      protected readonly data = [1, 2, 3];
    }
    TestBed.configureTestingModule({ imports: [ColorHost] });
    const fixture = TestBed.createComponent(ColorHost);
    fixture.detectChanges();
    const mark = fixture.nativeElement.querySelector('.cngx-bar') as SVGElement;
    expect(mark).not.toBeNull();
    expect(mark.getAttribute('fill')).toBe('rebeccapurple');
  });
});
