import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxBand } from './band.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxBand],
  template: `
    <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxBand [from]="from()" [to]="to()" [label]="label()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  from = signal<number>(2);
  to = signal<number>(8);
  label = signal<string | null>(null);
}

describe('CngxBand', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders a rect spanning the y-range from..to across the plot width', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGRectElement;
    expect(rect).not.toBeNull();
    // Gutters plus label overhang put the plot at x 30..189 by y 8..75.
    // y domain [0, 10] over that height (SVG-flipped): from=2 -> y=61.6
    // (bottom), to=8 -> y=21.4 (top).
    expect(Number(rect.getAttribute('y'))).toBeCloseTo(21.4, 5);
    expect(Number(rect.getAttribute('height'))).toBeCloseTo(40.2, 5);
    // Starts at the plot edge, not the box edge - otherwise the band
    // paints over the left axis's tick labels.
    expect(Number(rect.getAttribute('x'))).toBe(30);
    expect(Number(rect.getAttribute('width'))).toBe(159);
  });

  it('handles inverted from/to values without producing negative height', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.from.set(8);
    fixture.componentInstance.to.set(2);
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGRectElement;
    expect(Number(rect.getAttribute('y'))).toBeCloseTo(21.4, 5);
    expect(Number(rect.getAttribute('height'))).toBeCloseTo(40.2, 5);
  });

  it('renders an optional label aligned to the band', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set('Watch zone');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cngx-band__label') as SVGTextElement;
    expect(label?.textContent?.trim()).toBe('Watch zone');
  });
});
