import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from './chart.component';
import { CNGX_CHART_CONTEXT, type CngxChartContext } from './chart-context';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  selector: 'test-context-probe',
  standalone: true,
  template: `<span class="probe-marker"></span>`,
})
class ContextProbe {
  readonly ctx: CngxChartContext = inject(CNGX_CHART_CONTEXT);
}

@Component({
  selector: 'test-context-wrapper',
  standalone: true,
  imports: [ContextProbe],
  template: `<test-context-probe />`,
})
class ContextWrapper {}

@Component({
  standalone: true,
  imports: [CngxChart, ContextProbe, ContextWrapper],
  template: `
    <cngx-chart
      [data]="data()"
      [width]="width()"
      [height]="height()"
      data-testid="chart"
    >
      <test-context-probe data-testid="direct" />
      <test-context-wrapper data-testid="nested" />
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3]);
  width = signal<number | undefined>(200);
  height = signal<number | undefined>(100);
}

describe('CngxChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
    chart: HTMLElement;
    svg: SVGElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
    const svg = chart.querySelector('svg') as SVGElement;
    return { fixture, host, chart, svg };
  }

  function probesFor(
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>,
  ): ContextProbe[] {
    return fixture.debugElement
      .queryAll(By.directive(ContextProbe))
      .map((el) => el.componentInstance as ContextProbe);
  }

  it('hosts an svg child with a viewBox derived from [width]/[height] inputs', () => {
    const { svg } = setup();
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 100');
  });

  it('updates the viewBox when [width]/[height] inputs change', () => {
    const { fixture, svg } = setup();
    fixture.componentInstance.width.set(400);
    fixture.componentInstance.height.set(50);
    fixture.detectChanges();
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 50');
  });

  it('carries role="img" on the host element', () => {
    const { chart } = setup();
    expect(chart.getAttribute('role')).toBe('img');
  });

  it('provides CNGX_CHART_CONTEXT to direct content children', () => {
    const { fixture } = setup();
    const probes = probesFor(fixture);
    expect(probes.length).toBeGreaterThanOrEqual(1);
    const ctx = probes[0].ctx;
    expect(ctx).toBeDefined();
    expect(ctx.dataLength()).toBe(3);
    expect(ctx.dimensions()).toEqual({ width: 200, height: 100 });
  });

  it('provides CNGX_CHART_CONTEXT to nested content children (passes through wrappers)', () => {
    const { fixture } = setup();
    const wrapperEls = fixture.debugElement.queryAll(By.directive(ContextWrapper));
    expect(wrapperEls.length).toBe(1);
    const nestedProbes = wrapperEls[0]
      .queryAll(By.directive(ContextProbe))
      .map((el) => el.componentInstance as ContextProbe);
    expect(nestedProbes.length).toBe(1);
    expect(nestedProbes[0].ctx.dataLength()).toBe(3);
  });

  it('exposes xScale/yScale signals carrying callable scale functions', () => {
    const { fixture } = setup();
    const ctx = probesFor(fixture)[0].ctx;
    expect(typeof ctx.xScale()).toBe('function');
    expect(typeof ctx.yScale()).toBe('function');
    expect(typeof ctx.xScale()(0)).toBe('number');
    expect(typeof ctx.yScale()(0)).toBe('number');
  });

  it('reflects data input changes through the dataLength signal', () => {
    const { fixture } = setup();
    const ctx = probesFor(fixture)[0].ctx;
    expect(ctx.dataLength()).toBe(3);
    fixture.componentInstance.data.set([1, 2, 3, 4, 5, 6]);
    fixture.detectChanges();
    expect(ctx.dataLength()).toBe(6);
  });

  it('binds an aria-label on the host derived from the auto-Summary', () => {
    const { fixture, chart } = setup();
    fixture.componentInstance.data.set([5, 12, 18, 38]);
    fixture.detectChanges();
    const label = chart.getAttribute('aria-label') ?? '';
    // English defaults: "Trending up. Min 5, max 38, current 38. No thresholds."
    expect(label).toContain('Trending up');
    expect(label).toContain('Min 5');
    expect(label).toContain('current 38');
    expect(label).toContain('No thresholds');
  });

  it('reactively updates the aria-label as data changes', () => {
    const { fixture, chart } = setup();
    fixture.componentInstance.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    const labelDown = chart.getAttribute('aria-label') ?? '';
    expect(labelDown).toContain('Trending down');

    fixture.componentInstance.data.set([10, 12, 14, 18, 22]);
    fixture.detectChanges();
    const labelUp = chart.getAttribute('aria-label') ?? '';
    expect(labelUp).toContain('Trending up');
    expect(labelDown).not.toBe(labelUp);
  });

  it('renders the auto-Summary as the SVG <title> element', () => {
    const { svg } = setup();
    const title = svg.querySelector('title');
    expect(title).not.toBeNull();
    expect((title?.textContent ?? '').length).toBeGreaterThan(0);
  });

  it('warns in dev-mode when data is non-numeric and no [summaryAccessor] is bound', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `<cngx-chart [data]="data" [width]="100" [height]="50" />`,
    })
    class NonNumericHost {
      data: readonly { value: number }[] = [{ value: 5 }, { value: 10 }];
    }
    TestBed.configureTestingModule({ imports: [NonNumericHost] });
    const fixture = TestBed.createComponent(NonNumericHost);
    fixture.detectChanges();
    TestBed.tick();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('CngxChart: data is non-numeric'),
    );
    warn.mockRestore();
  });

  it('does NOT warn when [summaryAccessor] is provided', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `
        <cngx-chart
          [data]="data"
          [width]="100"
          [height]="50"
          [summaryAccessor]="acc"
        />
      `,
    })
    class TypedHost {
      data: readonly { value: number }[] = [{ value: 5 }];
      readonly acc = (d: { value: number }): number => d.value;
    }
    TestBed.configureTestingModule({ imports: [TypedHost] });
    const fixture = TestBed.createComponent(TypedHost);
    fixture.detectChanges();
    TestBed.tick();
    const warnedAboutChart = warn.mock.calls.some((call) =>
      String(call[0] ?? '').includes('CngxChart: data is non-numeric'),
    );
    expect(warnedAboutChart).toBe(false);
    warn.mockRestore();
  });

  it('does NOT warn for numeric data with the default accessor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = setup();
    fixture.detectChanges();
    TestBed.tick();
    const warnedAboutChart = warn.mock.calls.some((call) =>
      String(call[0] ?? '').includes('CngxChart: data is non-numeric'),
    );
    expect(warnedAboutChart).toBe(false);
    warn.mockRestore();
  });
});
