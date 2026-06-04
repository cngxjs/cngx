import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxMiniArea } from './mini-area.component';
import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxMiniArea],
  template: `<cngx-mini-area [data]="data()" [width]="80" [height]="24" />`,
})
class TestHost {
  data = signal<readonly number[]>([1, 4, 2, 8, 5]);
}

describe('CngxMiniArea', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders an svg with a closed area <path>', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement | null;
    expect(area).not.toBeNull();
    const d = area?.getAttribute('d') ?? '';
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('reflects data changes in the rendered path', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    const before = area.getAttribute('d');
    fixture.componentInstance.data.set([10, 8, 6, 4, 2]);
    fixture.detectChanges();
    expect(area.getAttribute('d')).not.toBe(before);
  });

  it('renders an empty d for an empty data array (no area drawn)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([]);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    expect(area.getAttribute('d') ?? '').toBe('');
  });
});
