import {
  Component,
  effect,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock } from '@cngx/testing';
import { CngxChart } from '../chart/chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from './line.component';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxLine],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="xDomain()"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="yDomain()"></svg:g>
      <svg:g cngxLine [accessor]="acc()" [points]="points()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  xDomain = signal<readonly unknown[]>([0, 4]);
  yDomain = signal<readonly unknown[]>([0, 5]);
  acc = signal<(d: number) => number>((d) => d);
  points = signal<'auto' | 'always' | 'never'>('auto');
}

@Component({
  standalone: true,
  imports: [CngxLine],
  template: `<div cngxLine [data]="data"></div>`,
})
class OrphanLineHost {
  data: readonly number[] = [1, 2, 3];
}

describe('CngxLine', () => {
  beforeEach(() => {
    createResizeObserverMock().install(window);
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    pathEl: SVGPathElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const pathEl = fixture.nativeElement.querySelector('.cngx-line') as SVGPathElement;
    return { fixture, pathEl };
  }

  it('renders an svg <path> with a non-empty d attribute', () => {
    const { pathEl } = setup();
    expect(pathEl).not.toBeNull();
    const d = pathEl.getAttribute('d') ?? '';
    expect(d.length).toBeGreaterThan(0);
    expect(d.startsWith('M ')).toBe(true);
  });

  it('reactively updates the d attribute when the data signal changes', () => {
    const { fixture, pathEl } = setup();
    const before = pathEl.getAttribute('d');
    fixture.componentInstance.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    const after = pathEl.getAttribute('d');
    expect(after).not.toBe(before);
  });

  it('throws a clear error when mounted without a <cngx-chart> parent (missing CNGX_CHART_CONTEXT)', () => {
    TestBed.configureTestingModule({ imports: [OrphanLineHost] });
    expect(() => {
      const f = TestBed.createComponent(OrphanLineHost);
      f.detectChanges();
    }).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX1048',
        message: expect.stringMatching(
          /^CNGX1048: \[cngxLine\] must be placed inside <cngx-chart>\./,
        ),
      }),
    );
  });

  it('cascade guard - a downstream effect on the line component does NOT re-fire when the d string is unchanged', () => {
    const { fixture } = setup();
    const lineEl = fixture.debugElement.query((el) => el.componentInstance instanceof CngxLine);
    const line = lineEl.componentInstance as CngxLine<number>;
    // Reach the protected `d` signal through the runtime instance - the spec
    // is the spec, not consumer surface; testing the cascade guard
    // requires reading the value the template binds to.
    const dSignal = (line as unknown as { d: () => string }).d;

    let runs = 0;
    const env = TestBed.inject(EnvironmentInjector);
    runInInjectionContext(env, () => {
      effect(() => {
        dSignal();
        runs++;
      });
    });
    TestBed.tick();
    const baselineRuns = runs;

    // Swap the data array to a fresh-reference copy with the same coordinates
    // AND keep the scales constant (yDomain and xDomain unchanged). The
    // path-builder rebuilds (data ref changed) but the resulting d string
    // is identical - the cascade guard must short-circuit.
    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();

    expect(runs).toBe(baselineRuns);
    void inject; // keep import to satisfy lint when not directly used
  });

  function points(
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>,
  ): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-line__point');
  }

  it("'auto' marks a single-datum series with exactly one point", () => {
    const { fixture } = setup();
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    expect(points(fixture).length).toBe(1);
  });

  it("'auto' marks nothing on a multi-point series", () => {
    const { fixture } = setup();
    // default data is [1..5]; auto is the default mode
    expect(points(fixture).length).toBe(0);
  });

  it("'always' marks every datum of a multi-point series", () => {
    const { fixture } = setup();
    fixture.componentInstance.points.set('always');
    fixture.detectChanges();
    expect(points(fixture).length).toBe(5);
  });

  it("'never' marks nothing, single-datum or multi-point", () => {
    const { fixture } = setup();
    fixture.componentInstance.points.set('never');
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    expect(points(fixture).length).toBe(0);
    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    expect(points(fixture).length).toBe(0);
  });

  it('cascade guard - a same-coordinate refresh of a marked single-datum series keeps the geometry identity', () => {
    const { fixture } = setup();
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();

    const lineEl = fixture.debugElement.query((el) => el.componentInstance instanceof CngxLine);
    const line = lineEl.componentInstance as CngxLine<number>;
    const geometry = (line as unknown as { geometry: () => unknown }).geometry;

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

    // Fresh-reference array, same single value, unchanged scales: the
    // marker recomputes to the same {cx,cy}, so the shared lineAreaGeomEqual
    // must hold and the geometry identity must not change.
    fixture.componentInstance.data.set([3]);
    fixture.detectChanges();
    TestBed.tick();

    expect(runs).toBe(baselineRuns);
  });
});

describe('CngxLine [color]', () => {
  beforeEach(() => createResizeObserverMock().install(window));
  afterEach(() => vi.unstubAllGlobals());

  it('binds [color] as an inline style that beats the stylesheet cascade', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxLine],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxLine [color]="'rebeccapurple'"></svg:g>
        </cngx-chart>
      `,
    })
    class ColorHost {}
    TestBed.configureTestingModule({ imports: [ColorHost] });
    const fixture = TestBed.createComponent(ColorHost);
    fixture.detectChanges();
    const mark = fixture.nativeElement.querySelector('.cngx-line') as SVGElement;
    // An attribute binding would be inert here: the .cngx-line class
    // rule sets stroke via --cngx-line-color and a class rule beats a
    // presentation attribute in the CSS cascade.
    expect((mark as SVGElement & { style: CSSStyleDeclaration }).style.stroke).toBe(
      'rebeccapurple',
    );
  });
});

describe('CngxLine point markers [color]', () => {
  beforeEach(() => createResizeObserverMock().install(window));
  afterEach(() => vi.unstubAllGlobals());

  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, CngxLine],
    template: `
      <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
        <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxLine [color]="color()" [points]="'always'"></svg:g>
      </cngx-chart>
    `,
  })
  class MarkerHost {
    color = signal<string | null>('#f00');
  }

  function circles(fixture: ReturnType<typeof TestBed.createComponent<MarkerHost>>): SVGElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGElement>('.cngx-line__point'),
    );
  }

  it('paints every marker with the bound colour as an inline fill', () => {
    TestBed.configureTestingModule({ imports: [MarkerHost] });
    const fixture = TestBed.createComponent(MarkerHost);
    fixture.detectChanges();
    const marks = circles(fixture);
    expect(marks.length).toBe(3);
    for (const mark of marks) {
      expect(mark.style.fill).toBe('rgb(255, 0, 0)');
    }
  });

  it('sets no inline fill on the markers when color is null', () => {
    TestBed.configureTestingModule({ imports: [MarkerHost] });
    const fixture = TestBed.createComponent(MarkerHost);
    fixture.componentInstance.color.set(null);
    fixture.detectChanges();
    const marks = circles(fixture);
    expect(marks.length).toBe(3);
    for (const mark of marks) {
      expect(mark.style.fill).toBe('');
    }
  });
});

describe('CngxLine [strokeWidth]', () => {
  beforeEach(() => createResizeObserverMock().install(window));
  afterEach(() => vi.unstubAllGlobals());

  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, CngxLine],
    template: `
      <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
        <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxLine [strokeWidth]="width()"></svg:g>
      </cngx-chart>
    `,
  })
  class StrokeHost {
    width = signal<number | string | null>(null);
  }

  function render(width: number | string | null): SVGElement {
    TestBed.configureTestingModule({ imports: [StrokeHost] });
    const fixture = TestBed.createComponent(StrokeHost);
    fixture.componentInstance.width.set(width);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.cngx-line') as SVGElement;
  }

  it('writes a numeric width as an inline px style', () => {
    const mark = render(4);
    expect(mark.style.strokeWidth).toBe('4px');
    expect(mark.getAttribute('stroke-width')).toBeNull();
  });

  it('passes a string width through as an inline style', () => {
    const mark = render('3px');
    expect(mark.style.strokeWidth).toBe('3px');
    expect(mark.getAttribute('stroke-width')).toBeNull();
  });

  it('sets no inline width when strokeWidth is null', () => {
    const mark = render(null);
    expect(mark.style.strokeWidth).toBe('');
    expect(mark.getAttribute('stroke-width')).toBeNull();
  });
});
