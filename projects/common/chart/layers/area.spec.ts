import {
  Component,
  EnvironmentInjector,
  effect,
  runInInjectionContext,
  signal,
} from '@angular/core';
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
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 4]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 5]"></svg:g>
      <svg:g cngxArea [points]="points()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  points = signal<'auto' | 'always' | 'never'>('auto');
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

  it('closes every finite run to the baseline individually around a NaN gap', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([1, 2, Number.NaN, 4, 5]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    const d = path.getAttribute('d') ?? '';
    expect(d).not.toContain('NaN');
    // Two subpaths, each with its own baseline closure - one whole-path
    // closure would fill straight across the gap.
    expect(d.match(/M /g)?.length).toBe(2);
    expect(d.match(/Z/g)?.length).toBe(2);
  });

  it('renders no fill at all when every value is non-finite', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([Number.NaN, Number.NaN]);
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('.cngx-area') as SVGPathElement;
    expect(path?.getAttribute('d') ?? '').toBe('');
  });

  function marks(
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>,
  ): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-area__point');
  }

  it("'auto' marks a single-datum series with exactly one point", () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    expect(marks(fixture).length).toBe(1);
  });

  it("'auto' marks nothing on a multi-point series", () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    expect(marks(fixture).length).toBe(0);
  });

  it("'always' marks every datum of a multi-point series", () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.points.set('always');
    fixture.detectChanges();
    expect(marks(fixture).length).toBe(5);
  });

  it("'never' marks nothing, single-datum or multi-point", () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.points.set('never');
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    expect(marks(fixture).length).toBe(0);
    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    expect(marks(fixture).length).toBe(0);
  });

  it('cascade guard - a same-coordinate refresh of a marked single-datum series keeps the geometry identity', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();

    const areaEl = fixture.debugElement.query((el) => el.componentInstance instanceof CngxArea);
    const area = areaEl.componentInstance as CngxArea<number>;
    const geometry = (area as unknown as { geometry: () => unknown }).geometry;

    let runs = 0;
    const env = TestBed.inject(EnvironmentInjector);
    runInInjectionContext(env, () => {
      effect(() => {
        geometry();
        runs++;
      });
    });
    TestBed.tick();
    const baselineRuns = runs;

    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    TestBed.tick();

    expect(runs).toBe(baselineRuns);
  });
});
