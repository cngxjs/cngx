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
      <cngx-axis position="bottom" type="linear" [domain]="[0, 2]" />
      <cngx-axis position="left" type="linear" [domain]="[0, 10]" />
      <cngx-band [from]="from()" [to]="to()" [label]="label()" />
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

  it('renders a rect spanning the y-range from..to across full chart width', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGRectElement;
    expect(rect).not.toBeNull();
    // y domain [0, 10] over height 100 (SVG-flipped):
    // from=2 -> y=80 (bottom), to=8 -> y=20 (top). Top = 20, height = 60.
    expect(Number(rect.getAttribute('y'))).toBe(20);
    expect(Number(rect.getAttribute('height'))).toBe(60);
    expect(Number(rect.getAttribute('width'))).toBe(200);
  });

  it('handles inverted from/to values without producing negative height', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.from.set(8);
    fixture.componentInstance.to.set(2);
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.cngx-band__rect') as SVGRectElement;
    expect(Number(rect.getAttribute('y'))).toBe(20);
    expect(Number(rect.getAttribute('height'))).toBe(60);
  });

  it('renders an optional label aligned to the band', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set('Watch zone');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cngx-band__label') as SVGTextElement;
    expect(label?.textContent?.trim()).toBe('Watch zone');
  });
});
