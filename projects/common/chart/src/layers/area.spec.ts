import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxArea } from './area.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxArea],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100">
      <cngx-axis position="bottom" type="linear" [domain]="[0, 4]" />
      <cngx-axis position="left" type="linear" [domain]="[0, 5]" />
      <cngx-area />
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
}

describe('CngxArea', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders an svg <path> with a closed shape (Z command)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    expect(path).not.toBeNull();
    const d = path.getAttribute('d') ?? '';
    expect(d.endsWith('Z')).toBe(true);
    expect(d.startsWith('M ')).toBe(true);
  });

  it('returns an empty d string when data is empty', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    expect(path?.getAttribute('d') ?? '').toBe('');
  });

  it('appends the baseline-return segment after the curve points', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    const d = path.getAttribute('d') ?? '';
    // Expect at least: M ... L ... L lastX baselineY L firstX baselineY Z
    expect(d.split(' L ').length).toBeGreaterThanOrEqual(3);
  });
});
