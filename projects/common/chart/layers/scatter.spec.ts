import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxScatter } from './scatter.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

interface Point {
  x: number;
  y: number;
}

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxScatter],
  template: `
    <cngx-chart [data]="data()" [width]="100" [height]="100">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxScatter [x]="xAcc" [y]="yAcc" [radius]="radius()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly Point[]>([
    { x: 0, y: 10 },
    { x: 5, y: 5 },
    { x: 10, y: 0 },
  ]);
  radius = signal<number>(4);
  readonly xAcc = (d: Point): number => d.x;
  readonly yAcc = (d: Point): number => d.y;
}

describe('CngxScatter', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders one circle per datapoint', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const circles = fixture.nativeElement.querySelectorAll('.cngx-scatter');
    expect(circles.length).toBe(3);
  });

  it('positions circles using the supplied x/y accessors', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const circles = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGCircleElement>('.cngx-scatter'),
    );
    const cxs = circles.map((c) => Number(c.getAttribute('cx')));
    expect(cxs).toEqual([0, 50, 100]);
  });

  it('binds the [radius] input to the r attribute', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.radius.set(7);
    fixture.detectChanges();
    const circles = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGCircleElement>('.cngx-scatter'),
    );
    expect(circles.every((c) => Number(c.getAttribute('r')) === 7)).toBe(true);
  });

  it('reflects data signal changes by re-rendering positions', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    fixture.componentInstance.data.set([{ x: 5, y: 5 }]);
    fixture.detectChanges();
    const circles = fixture.nativeElement.querySelectorAll('.cngx-scatter');
    expect(circles.length).toBe(1);
  });
});
