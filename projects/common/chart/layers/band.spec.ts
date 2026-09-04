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
    // Gutters plus label overhang put the plot at x 31..189 by y 9..74.
    // y domain [0, 10] over that height (SVG-flipped): from=2 -> y=61
    // (bottom), to=8 -> y=22 (top).
    expect(Number(rect.getAttribute('y'))).toBe(22);
    expect(Number(rect.getAttribute('height'))).toBe(39);
    // Starts at the plot edge, not the box edge - otherwise the band
    // paints over the left axis's tick labels.
    expect(Number(rect.getAttribute('x'))).toBe(31);
    expect(Number(rect.getAttribute('width'))).toBe(158);
  });

  it('handles inverted from/to values without producing negative height', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.from.set(8);
    fixture.componentInstance.to.set(2);
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGRectElement;
    expect(Number(rect.getAttribute('y'))).toBe(22);
    expect(Number(rect.getAttribute('height'))).toBe(39);
  });

  it('renders an optional label aligned to the band', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set('Watch zone');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cngx-band__label') as SVGTextElement;
    expect(label?.textContent?.trim()).toBe('Watch zone');
  });
});

describe('CngxBand [color] parity', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('binds [color] onto the SVG mark like CngxLine does', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxBand],
      template: `
        <cngx-chart [data]="data" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxBand [from]="2" [to]="8" [color]="'rebeccapurple'"></svg:g>
        </cngx-chart>
      `,
    })
    class ColorHost {
      protected readonly data = [1, 2, 3];
    }
    TestBed.configureTestingModule({ imports: [ColorHost] });
    const fixture = TestBed.createComponent(ColorHost);
    fixture.detectChanges();
    const mark = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGElement;
    expect(mark).not.toBeNull();
    // An inline style, not a presentation attribute - the class rule
    // (stroke/fill via --cngx-* vars) would beat an attribute in the
    // CSS cascade and render the bound color inert.
    expect((mark as unknown as SVGElement & { style: CSSStyleDeclaration }).style.fill).toBe(
      'rebeccapurple',
    );
  });
});
