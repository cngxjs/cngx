import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxSparkline } from './sparkline.component';
import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxSparkline],
  template: `
    <cngx-sparkline
      [data]="data()"
      [width]="width()"
      [height]="height()"
      [showArea]="showArea()"
    />
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  width = signal<number>(80);
  height = signal<number>(24);
  showArea = signal<boolean>(false);
}

describe('CngxSparkline', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders an svg with a <path> for the line', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-line') as SVGPathElement | null;
    expect(path).not.toBeNull();
    expect((path?.getAttribute('d') ?? '').startsWith('M ')).toBe(true);
  });

  it('does NOT render an area path when [showArea] is false (default)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.cngx-area');
    expect(area).toBeNull();
  });

  it('renders an area path when [showArea] is true', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.showArea.set(true);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.cngx-area');
    expect(area).not.toBeNull();
  });

  it('reflects data changes in the rendered path', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-line') as SVGPathElement;
    const before = path.getAttribute('d');
    fixture.componentInstance.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    expect(path.getAttribute('d')).not.toBe(before);
  });

  it('handles a flat-line data series without producing NaN coordinates', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([5, 5, 5]);
    fixture.detectChanges();
    const d = fixture.nativeElement.querySelector('.cngx-line').getAttribute('d') ?? '';
    expect(d.includes('NaN')).toBe(false);
  });
});
