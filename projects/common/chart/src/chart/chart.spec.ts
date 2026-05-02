import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from './chart.component';
import { CNGX_CHART_CONTEXT, type CngxChartContext } from './chart-context';

class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

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
});
