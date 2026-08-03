import {
  Component,
  effect,
  EnvironmentInjector,
  inject,
  type Provider,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from './chart.component';
import { CNGX_CHART_CONTEXT, type CngxChartContext } from './chart-context';
import { CngxChartConnectionError, CngxChartEmpty, CngxChartError } from './template-slots';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from '../layers/line.component';
import { CngxBar } from '../layers/bar.component';
import { CngxThreshold } from '../layers/threshold.component';
import { CngxBand } from '../layers/band.component';
import { type LayerGeometry } from '../layers/chart-layer';
import { type CngxChartRendererFactory } from '../renderer/chart-renderer';
import { createCanvasRenderer } from '../renderer/canvas-renderer';
import {
  provideChartRenderer,
  withChartRendererFactory,
  withChartRendererThreshold,
} from '../renderer/renderer-factory';

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
    <cngx-chart [data]="data()" [width]="width()" [height]="height()" data-testid="chart">
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
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CngxChart: data is non-numeric'));
    warn.mockRestore();
  });

  it('does NOT warn when [summaryAccessor] is provided', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `
        <cngx-chart [data]="data" [width]="100" [height]="50" [summaryAccessor]="acc" />
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

  describe('[state] envelope', () => {
    it('renders SVG content when no [state] is bound (default branch)', () => {
      const { svg } = setup();
      expect(svg).not.toBeNull();
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });

    it('renders the skeleton element on first-load loading state and sets aria-busy', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart],
        template: `
          <cngx-chart
            [data]="[1, 2, 3]"
            [state]="state"
            [width]="200"
            [height]="100"
            data-testid="chart"
          ></cngx-chart>
        `,
      })
      class StateHost {
        readonly state = createManualState<readonly number[]>();
      }
      TestBed.configureTestingModule({ imports: [StateHost] });
      const fixture = TestBed.createComponent(StateHost);
      fixture.componentInstance.state.set('loading');
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      expect(chart.querySelector('svg')).toBeNull();
      expect(chart.querySelector('.cngx-chart__loading')).not.toBeNull();
      expect(chart.querySelector('.cngx-chart__spinner')).not.toBeNull();
      expect(chart.getAttribute('aria-busy')).toBe('true');
      expect(chart.getAttribute('aria-label')).toBe('Loading');
    });

    it('renders the empty fallback when state succeeds with empty data', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart],
        template: `
          <cngx-chart
            [data]="data"
            [state]="state"
            [width]="200"
            [height]="100"
            data-testid="chart"
          ></cngx-chart>
        `,
      })
      class EmptyHost {
        readonly state = createManualState<readonly number[]>();
        data: readonly number[] = [];
      }
      TestBed.configureTestingModule({ imports: [EmptyHost] });
      const fixture = TestBed.createComponent(EmptyHost);
      fixture.componentInstance.state.setSuccess([]);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      expect(chart.querySelector('svg')).toBeNull();
      const fallback = chart.querySelector('.cngx-chart__fallback');
      expect(fallback).not.toBeNull();
      expect(fallback?.classList.contains('cngx-chart__fallback--error')).toBe(false);
      expect(chart.getAttribute('aria-label')).toBe('No data');
    });

    it('renders the error fallback when state fails on first load', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart],
        template: `
          <cngx-chart
            [data]="[1, 2, 3]"
            [state]="state"
            [width]="200"
            [height]="100"
            data-testid="chart"
          ></cngx-chart>
        `,
      })
      class ErrorHost {
        readonly state = createManualState<readonly number[]>();
      }
      TestBed.configureTestingModule({ imports: [ErrorHost] });
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.componentInstance.state.setError(new Error('boom'));
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      const fallback = chart.querySelector('.cngx-chart__fallback--error');
      expect(fallback).not.toBeNull();
      expect(chart.getAttribute('aria-label')).toBe('Error loading chart');
      expect(chart.getAttribute('aria-busy')).toBeNull();
    });

    it('renders the *cngxChartEmpty slot template instead of the default fallback when projected', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart, CngxChartEmpty],
        template: `
          <cngx-chart [data]="[]" [state]="state" [width]="200" [height]="100" data-testid="chart">
            <ng-template cngxChartEmpty>
              <div data-testid="custom-empty">Try a different filter</div>
            </ng-template>
          </cngx-chart>
        `,
      })
      class EmptySlotHost {
        readonly state = createManualState<readonly number[]>();
      }
      TestBed.configureTestingModule({ imports: [EmptySlotHost] });
      const fixture = TestBed.createComponent(EmptySlotHost);
      fixture.componentInstance.state.setSuccess([]);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      expect(chart.querySelector('.cngx-chart__fallback')).toBeNull();
      const custom = chart.querySelector('[data-testid="custom-empty"]');
      expect(custom).not.toBeNull();
      expect(custom?.textContent?.trim()).toBe('Try a different filter');
    });

    it('passes the live error value to the *cngxChartError slot context', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart, CngxChartError],
        template: `
          <cngx-chart
            [data]="[1, 2, 3]"
            [state]="state"
            [width]="200"
            [height]="100"
            data-testid="chart"
          >
            <ng-template cngxChartError let-err="error">
              <div data-testid="custom-error">err: {{ err.message }}</div>
            </ng-template>
          </cngx-chart>
        `,
      })
      class ErrorSlotHost {
        readonly state = createManualState<readonly number[]>();
      }
      TestBed.configureTestingModule({ imports: [ErrorSlotHost] });
      const fixture = TestBed.createComponent(ErrorSlotHost);
      fixture.componentInstance.state.setError(new Error('boom'));
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      expect(chart.querySelector('.cngx-chart__fallback--error')).toBeNull();
      const custom = chart.querySelector('[data-testid="custom-error"]');
      expect(custom?.textContent?.trim()).toBe('err: boom');
    });

    it('applies the responsive class only when both [width] and [height] are unset', () => {
      @Component({
        standalone: true,
        imports: [CngxChart],
        template: `
          <cngx-chart [data]="data" data-testid="responsive"></cngx-chart>
          <cngx-chart [data]="data" [width]="400" data-testid="explicit-w"></cngx-chart>
          <cngx-chart [data]="data" [height]="200" data-testid="explicit-h"></cngx-chart>
          <cngx-chart
            [data]="data"
            [width]="400"
            [height]="200"
            data-testid="explicit-both"
          ></cngx-chart>
        `,
      })
      class ResponsiveHost {
        data: readonly number[] = [1, 2, 3];
      }
      TestBed.configureTestingModule({ imports: [ResponsiveHost] });
      const fixture = TestBed.createComponent(ResponsiveHost);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const responsive = host.querySelector('[data-testid="responsive"]') as HTMLElement;
      const explicitW = host.querySelector('[data-testid="explicit-w"]') as HTMLElement;
      const explicitH = host.querySelector('[data-testid="explicit-h"]') as HTMLElement;
      const explicitBoth = host.querySelector('[data-testid="explicit-both"]') as HTMLElement;
      expect(responsive.classList.contains('cngx-chart--responsive')).toBe(true);
      expect(explicitW.classList.contains('cngx-chart--responsive')).toBe(false);
      expect(explicitH.classList.contains('cngx-chart--responsive')).toBe(false);
      expect(explicitBoth.classList.contains('cngx-chart--responsive')).toBe(false);
    });

    it('switches back to SVG content when state transitions to success with data', async () => {
      const { createManualState } = await import('@cngx/common/data');
      @Component({
        standalone: true,
        imports: [CngxChart],
        template: `
          <cngx-chart
            [data]="[1, 2, 3]"
            [state]="state"
            [width]="200"
            [height]="100"
            data-testid="chart"
          ></cngx-chart>
        `,
      })
      class StateHost {
        readonly state = createManualState<readonly number[]>();
      }
      TestBed.configureTestingModule({ imports: [StateHost] });
      const fixture = TestBed.createComponent(StateHost);
      fixture.componentInstance.state.set('loading');
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const chart = host.querySelector('[data-testid="chart"]') as HTMLElement;
      expect(chart.querySelector('.cngx-chart__loading')).not.toBeNull();
      fixture.componentInstance.state.setSuccess([1, 2, 3]);
      fixture.detectChanges();
      expect(chart.querySelector('.cngx-chart__loading')).toBeNull();
      expect(chart.querySelector('svg')).not.toBeNull();
    });
  });
});

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxLine, CngxBar],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100" data-testid="chart">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxBar></svg:g>
    </cngx-chart>
  `,
})
class SwitchHost {
  readonly data = signal<readonly number[]>([1, 2, 3, 4, 5]);
}

describe('CngxChart — auto-switch backend (Phase 3)', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  function mount(
    providers: Provider[] = [],
    data?: readonly number[],
  ): { fixture: ReturnType<typeof TestBed.createComponent<SwitchHost>>; chart: HTMLElement } {
    TestBed.configureTestingModule({ imports: [SwitchHost], providers });
    const fixture = TestBed.createComponent(SwitchHost);
    if (data) {
      fixture.componentInstance.data.set(data);
    }
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    return { fixture, chart };
  }

  it('stays on SVG below the threshold — layer atoms render, no canvas', () => {
    const { chart } = mount();
    expect(chart.querySelector('.cngx-line')).not.toBeNull();
    expect(chart.querySelector('canvas')).toBeNull();
  });

  it('switches to canvas above the threshold — canvas mounts, layer SVG suppressed', () => {
    const { chart } = mount(
      [],
      Array.from({ length: 501 }, (_, i) => i % 10),
    );
    expect(chart.querySelector('canvas')).not.toBeNull();
    expect(chart.querySelector('.cngx-line')).toBeNull();
    expect(chart.querySelector('.cngx-bar')).toBeNull();
  });

  it('honours a factory override regardless of length', () => {
    const alwaysCanvas: CngxChartRendererFactory = (_mode, deps) => createCanvasRenderer(deps);
    const { chart } = mount([provideChartRenderer(withChartRendererFactory(alwaysCanvas))]);
    expect(chart.querySelector('canvas')).not.toBeNull();
  });

  it('honours a threshold override, flipping to canvas at a lower count', () => {
    const { chart } = mount(
      [provideChartRenderer(withChartRendererThreshold(50))],
      Array.from({ length: 51 }, (_, i) => i % 10),
    );
    expect(chart.querySelector('canvas')).not.toBeNull();
    expect(chart.querySelector('.cngx-line')).toBeNull();
  });

  it('short-circuits the aggregate geometries computed when no layer changed', () => {
    const { fixture } = mount();
    const chartInstance = fixture.debugElement.query(By.directive(CngxChart))
      .componentInstance as CngxChart<number>;
    const geometries = (chartInstance as unknown as { geometries: () => readonly LayerGeometry[] })
      .geometries;

    const env = TestBed.inject(EnvironmentInjector);
    let runs = 0;
    runInInjectionContext(env, () => {
      effect(() => {
        geometries();
        runs++;
      });
    });
    TestBed.tick();
    const base = runs;

    // Fresh-reference array, identical values: every layer's geometry is
    // reference-stable, so the mapped array short-circuits.
    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();
    expect(runs).toBe(base);

    // A genuine change flows through.
    fixture.componentInstance.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    TestBed.tick();
    expect(runs).toBeGreaterThan(base);
  });
});

describe('CngxChart — [connectionState] envelope (Phase 4)', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('shows no connection overlay when [connectionState] is unbound', () => {
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `<cngx-chart
        [data]="[1, 2, 3]"
        [width]="200"
        [height]="100"
        data-testid="chart"
      />`,
    })
    class Host {}
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    expect(chart.querySelector('.cngx-chart__connection-overlay')).toBeNull();
  });

  it('renders the reconnecting overlay (role=status) with the default i18n on refreshing', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `<cngx-chart
        [data]="[1, 2, 3]"
        [connectionState]="cs"
        [width]="200"
        [height]="100"
        data-testid="chart"
      />`,
    })
    class Host {
      readonly cs = createManualState<unknown>();
    }
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.cs.set('refreshing');
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    const overlay = chart.querySelector('.cngx-chart__connection-overlay--reconnecting');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('status');
    expect(overlay?.textContent?.trim()).toBe('Reconnecting');
    // Data view is not overridden by a connection blip.
    expect(chart.querySelector('svg')).not.toBeNull();
  });

  it('renders the error overlay (role=alert) with the default i18n on connection error', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `<cngx-chart
        [data]="[1, 2, 3]"
        [connectionState]="cs"
        [width]="200"
        [height]="100"
        data-testid="chart"
      />`,
    })
    class Host {
      readonly cs = createManualState<unknown>();
    }
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.cs.setError(new Error('socket closed'));
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    const overlay = chart.querySelector('.cngx-chart__connection-overlay--error');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('alert');
    expect(overlay?.textContent?.trim()).toBe('Connection lost');
  });

  it('projects the *cngxChartConnectionError slot template over the default banner', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart, CngxChartConnectionError],
      template: `
        <cngx-chart
          [data]="[1, 2, 3]"
          [connectionState]="cs"
          [width]="200"
          [height]="100"
          data-testid="chart"
        >
          <ng-template cngxChartConnectionError>CUSTOM OFFLINE</ng-template>
        </cngx-chart>
      `,
    })
    class Host {
      readonly cs = createManualState<unknown>();
    }
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.cs.setError(new Error('down'));
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    const overlay = chart.querySelector('.cngx-chart__connection-overlay--error');
    expect(overlay?.textContent?.trim()).toBe('CUSTOM OFFLINE');
    expect(overlay?.getAttribute('role')).toBe('alert');
  });

  it('keeps the data [state] view independent of a connection error', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart],
      template: `<cngx-chart
        [data]="[1, 2, 3]"
        [state]="state"
        [connectionState]="cs"
        [width]="200"
        [height]="100"
        data-testid="chart"
      />`,
    })
    class Host {
      readonly state = createManualState<readonly number[]>();
      readonly cs = createManualState<unknown>();
    }
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.state.setSuccess([1, 2, 3]);
    fixture.componentInstance.cs.setError(new Error('blip'));
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    // Data content renders (svg), connection error overlays on top — no precedence contention.
    expect(chart.querySelector('svg')).not.toBeNull();
    expect(chart.querySelector('.cngx-chart__connection-overlay--error')).not.toBeNull();
  });
});

describe('CngxChart — canvas overlay gated on the content view (Phase 3 blocker fix)', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('suppresses the canvas overlay while a fallback view is active', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxLine],
      template: `
        <cngx-chart [data]="data" [state]="state" [width]="200" [height]="100" data-testid="chart">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxLine></svg:g>
        </cngx-chart>
      `,
    })
    class Host {
      readonly state = createManualState<readonly number[]>();
      readonly data = Array.from({ length: 501 }, (_, i) => i % 10); // > threshold -> canvas
    }
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);

    // Error on first load -> fallback view; canvas is mounted (canvas mode)
    // but the content-hidden class suppresses it via CSS.
    fixture.componentInstance.state.setError(new Error('feed down'));
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    expect(chart.classList.contains('cngx-chart--content-hidden')).toBe(true);
    const canvas = chart.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).not.toBeNull();
    expect(getComputedStyle(canvas).display).toBe('none');

    // Recover -> content view; canvas visible again.
    fixture.componentInstance.state.setSuccess(fixture.componentInstance.data);
    fixture.detectChanges();
    expect(chart.classList.contains('cngx-chart--content-hidden')).toBe(false);
    expect(getComputedStyle(canvas).display).not.toBe('none');
  });
});

describe('CngxChart - plot inset', () => {
  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, ContextProbe],
    template: `
      <cngx-chart [data]="[1, 2, 3]" [width]="width()" [height]="height()">
        <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 100]"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 50]"></svg:g>
        <test-context-probe />
      </cngx-chart>
    `,
  })
  class AxedHost {
    width = signal<number | undefined>(200);
    height = signal<number | undefined>(100);
  }

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [AxedHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function ctxFor(fixture: ReturnType<typeof TestBed.createComponent<AxedHost>>): CngxChartContext {
    return (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;
  }

  // The host mounts a bottom axis over [0, 100] and a left one over
  // [0, 50] in a 200x100 box. The bottom axis reserves the 26 its
  // single line box needs on block-end plus 11 of label overhang on
  // each inline side; the left one's widest label is '12.5', four
  // characters, so it reserves 38, plus 9 of line-box overhang on each
  // block side.
  it('publishes a plot area the projected axes have reserved room out of', () => {
    const fixture = TestBed.createComponent(AxedHost);
    fixture.detectChanges();
    expect(ctxFor(fixture).plot()).toEqual({
      x0: 38,
      y0: 9,
      x1: 189,
      y1: 74,
      width: 151,
      height: 65,
    });
  });

  it('maps the x scale across the plot width, not the box width', () => {
    const fixture = TestBed.createComponent(AxedHost);
    fixture.detectChanges();
    const x = ctxFor(fixture).xScale();
    expect(x(0)).toBe(38);
    expect(x(100)).toBe(189);
  });

  it('maps the y scale across the plot height, flipped', () => {
    const fixture = TestBed.createComponent(AxedHost);
    fixture.detectChanges();
    const y = ctxFor(fixture).yScale();
    expect(y(0)).toBe(74);
    expect(y(50)).toBe(9);
  });

  it('holds the plot reference across a re-read that changes nothing', () => {
    const fixture = TestBed.createComponent(AxedHost);
    fixture.detectChanges();
    const ctx = ctxFor(fixture);
    const first = ctx.plot();
    // Same dimensions, fresh evaluation: the guard is what keeps both
    // scales and every axis geometry from rebuilding on an unchanged box.
    fixture.componentInstance.width.set(200);
    fixture.detectChanges();
    expect(ctx.plot()).toBe(first);

    // A real change flows through. x1 trails the box by the bottom
    // axis's inline overhang.
    fixture.componentInstance.width.set(400);
    fixture.detectChanges();
    expect(ctx.plot().x1).toBe(389);
  });

  it('returns the NOOP scale rather than an inverted range on a collapsed box', () => {
    const fixture = TestBed.createComponent(AxedHost);
    fixture.detectChanges();
    const ctx = ctxFor(fixture);
    fixture.componentInstance.width.set(0);
    fixture.componentInstance.height.set(0);
    fixture.detectChanges();
    expect(ctx.xScale()(100)).toBe(0);
    expect(ctx.yScale()(50)).toBe(0);
  });
});

describe('CngxChart - inset derived per axis combination', () => {
  // A 200x100 box, both axes over [0, 100], whose widest label is
  // '100'. The bottom axis reserves 26 on block-end (one line box) and
  // 11 on each inline side (half its widest label); the left axis
  // reserves 31 on inline-start (three characters) and 9 on each block
  // side (half a line box).
  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, ContextProbe],
    template: `
      <cngx-chart [data]="[1, 2, 3]" [width]="width()" [height]="100">
        @if (hasBottom()) {
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 100]"></svg:g>
        }
        @if (hasLeft()) {
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 100]"></svg:g>
        }
        <test-context-probe />
      </cngx-chart>
    `,
  })
  class ComboHost {
    width = signal<number | undefined>(200);
    hasBottom = signal(false);
    hasLeft = signal(false);
  }

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [ComboHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function plotFor(bottom: boolean, left: boolean): ReturnType<CngxChartContext['plot']> {
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasBottom.set(bottom);
    fixture.componentInstance.hasLeft.set(left);
    fixture.detectChanges();
    return (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx.plot();
  }

  it('reserves nothing at all when no axis is projected', () => {
    expect(plotFor(false, false)).toEqual({
      x0: 0,
      y0: 0,
      x1: 200,
      y1: 100,
      width: 200,
      height: 100,
    });
  });

  it('reserves its gutter on inline-start for a lone left axis, overhang on the block sides', () => {
    const plot = plotFor(false, true);
    expect(plot.x0).toBe(31);
    // No axis faces inline-end, so nothing reserves there.
    expect(plot.x1).toBe(200);
    // Its own topmost and bottommost labels are centred on the plot
    // corners, so half a line box comes off each block side.
    expect(plot.y0).toBe(9);
    expect(plot.y1).toBe(91);
  });

  it('reserves its gutter on block-end for a lone bottom axis, overhang on the inline sides', () => {
    const plot = plotFor(true, false);
    expect(plot.y1).toBe(74);
    expect(plot.y0).toBe(0);
    expect(plot.x0).toBe(11);
    expect(plot.x1).toBe(189);
  });

  it('reserves nothing for an axis that draws nothing', () => {
    // The presets mount axes purely to publish a scale domain. An
    // undecorated axis renders no line, tick or label, so charging it a
    // gutter would shrink the mark for decoration that never paints.
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, ContextProbe],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="80" [height]="24">
          <svg:g
            cngxAxis
            [decorated]="false"
            position="bottom"
            type="linear"
            [domain]="[0, 100]"
          ></svg:g>
          <svg:g
            cngxAxis
            [decorated]="false"
            position="left"
            type="linear"
            [domain]="[0, 100]"
          ></svg:g>
          <test-context-probe />
        </cngx-chart>
      `,
    })
    class BareHost {}
    TestBed.configureTestingModule({ imports: [BareHost] });
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const ctx = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;
    // The full box - a sparkline at 80x24 has no room to give away.
    expect(ctx.plot()).toEqual({ x0: 0, y0: 0, x1: 80, y1: 24, width: 80, height: 24 });
    // And the scales still resolve, because the domain still publishes.
    expect(ctx.xScale()(0)).toBe(0);
    expect(ctx.xScale()(100)).toBe(80);
    expect((fixture.nativeElement as HTMLElement).querySelector('.cngx-axis__line')).toBeNull();
  });

  it('publishes the resolved plot inset as host custom properties, in percent', () => {
    // HTML overlays sit on the host box, not in the viewBox, so the
    // only way for one to align to the plot is for the chart to hand
    // out the inset. Percent, not px: an explicit [width] chart
    // squeezed by max-width keeps its viewBox, so a user unit stops
    // being a CSS pixel while a fraction stays a fraction.
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasBottom.set(true);
    fixture.componentInstance.hasLeft.set(true);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector('cngx-chart') as HTMLElement;
    // 31 and 11 of a 200-wide box; 9 and 26 of a 100-tall one.
    expect(host.style.getPropertyValue('--cngx-chart-plot-inline-start')).toBe('15.5%');
    expect(host.style.getPropertyValue('--cngx-chart-plot-inline-end')).toBe('5.5%');
    expect(host.style.getPropertyValue('--cngx-chart-plot-block-start')).toBe('9%');
    expect(host.style.getPropertyValue('--cngx-chart-plot-block-end')).toBe('26%');
  });

  it('publishes a zero plot inset when no axis reserves anything', () => {
    const fixture = TestBed.createComponent(ComboHost);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector('cngx-chart') as HTMLElement;
    expect(host.style.getPropertyValue('--cngx-chart-plot-inline-start')).toBe('0%');
    expect(host.style.getPropertyValue('--cngx-chart-plot-block-end')).toBe('0%');
  });

  it('rescales the published percentages with the box', () => {
    // The gutter is a fixed number of user units, so its share of a
    // wider box is smaller. Publishing that share rather than the
    // pixel count is what survives an explicit-width chart being
    // squeezed below its own viewBox.
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasLeft.set(true);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector('cngx-chart') as HTMLElement;
    expect(host.style.getPropertyValue('--cngx-chart-plot-inline-start')).toBe('15.5%');
    fixture.componentInstance.width.set(400);
    fixture.detectChanges();
    expect(host.style.getPropertyValue('--cngx-chart-plot-inline-start')).toBe('7.75%');
  });

  it('grows the cross-axis overhang with the label that overhangs', () => {
    // The bottom axis's inline overhang is half its widest label, so a
    // seven-character domain pushes the plot corners further in than a
    // three-character one. This is the half-label that hangs past the
    // plot corner: without it the last tick label paints outside the
    // viewBox no matter how deep the block-end gutter is.
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, ContextProbe],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="domain()"></svg:g>
          <test-context-probe />
        </cngx-chart>
      `,
    })
    class OverhangHost {
      domain = signal<readonly unknown[]>([0, 100]);
    }
    TestBed.configureTestingModule({ imports: [OverhangHost] });
    const fixture = TestBed.createComponent(OverhangHost);
    fixture.detectChanges();
    const ctx = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;
    expect(ctx.plot().x0).toBe(11);
    expect(ctx.plot().x1).toBe(189);

    fixture.componentInstance.domain.set([0, 1200000]);
    fixture.detectChanges();
    expect(ctx.plot().x0).toBe(26);
    expect(ctx.plot().x1).toBe(174);
  });

  it('reserves on both sides when both axes are projected', () => {
    expect(plotFor(true, true)).toEqual({
      x0: 31,
      y0: 9,
      x1: 189,
      y1: 74,
      width: 158,
      height: 65,
    });
  });

  it('shrinks the x range by exactly the room the left axis reserved', () => {
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasLeft.set(true);
    fixture.detectChanges();
    const ctx = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;
    const x = ctx.xScale();
    // No horizontal axis, so xScale is the NOOP - the range shrink is
    // observable on the plot the scale is built from.
    expect(ctx.plot().width).toBe(200 - 31);
    expect(ctx.plot().height).toBe(100 - 9 - 9);
    expect(typeof x).toBe('function');
  });

  it('returns the NOOP scale rather than an inverted range on a box narrower than its own inset', () => {
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasBottom.set(true);
    fixture.componentInstance.hasLeft.set(true);
    fixture.componentInstance.width.set(20);
    fixture.detectChanges();
    const ctx = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;
    // 30 reserved inside a 20-wide box collapses the plot.
    expect(ctx.plot().width).toBeLessThan(0);
    expect(ctx.xScale()(100)).toBe(0);
  });

  it('settles rather than looping when the axis set feeds the plot it is placed against', () => {
    const fixture = TestBed.createComponent(ComboHost);
    fixture.componentInstance.hasBottom.set(true);
    fixture.componentInstance.hasLeft.set(true);
    fixture.detectChanges();
    const ctx = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx;

    let runs = 0;
    const injector = TestBed.inject(EnvironmentInjector);
    runInInjectionContext(injector, () => {
      effect(() => {
        ctx.plot();
        runs++;
      });
    });
    TestBed.tick();
    const settled = runs;

    // reservation -> inset -> plot -> scale -> tickRenderings has no
    // back edge: tickValues reads domain/ticks/type and never the
    // scale, so a re-flush adds no further runs.
    fixture.detectChanges();
    TestBed.tick();
    expect(runs).toBe(settled);

    // A real change flows through exactly once.
    fixture.componentInstance.width.set(400);
    fixture.detectChanges();
    TestBed.tick();
    expect(runs).toBe(settled + 1);
  });
});

/**
 * The canvas backend never draws axis decoration - `canvas-renderer.ts`
 * has no axis branch - so the two render paths can only disagree about
 * where the plot is if the geometries the canvas paints stop matching
 * the plot the axes are placed on. These assert they cannot.
 */
describe('CngxChart - canvas marks land in the same plot the axes sit on', () => {
  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, CngxLine, CngxThreshold, CngxBand, ContextProbe],
    template: `
      <cngx-chart [data]="data()" [width]="200" [height]="100" data-testid="chart">
        <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxLine></svg:g>
        <svg:g cngxThreshold [value]="5"></svg:g>
        <svg:g cngxBand [from]="2" [to]="8"></svg:g>
        <test-context-probe />
      </cngx-chart>
    `,
  })
  class CanvasHost {
    readonly data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  }

  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  function mount(pointCount: number): {
    chartEl: HTMLElement;
    plot: ReturnType<CngxChartContext['plot']>;
    geometries: readonly LayerGeometry[];
    axisTransforms: Record<string, string | null>;
  } {
    // Both crossover sides mount in one test, so the module has to be
    // torn down between them.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CanvasHost],
      providers: [provideChartRenderer(withChartRendererThreshold(50))],
    });
    const fixture = TestBed.createComponent(CanvasHost);
    fixture.componentInstance.data.set(Array.from({ length: pointCount }, (_, i) => i % 10));
    fixture.detectChanges();
    const chartEl = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    const instance = fixture.debugElement.query(By.directive(CngxChart))
      .componentInstance as CngxChart<number>;
    const geometries = (
      instance as unknown as { geometries: () => readonly LayerGeometry[] }
    ).geometries();
    const plot = (
      fixture.debugElement.query(By.directive(ContextProbe)).componentInstance as ContextProbe
    ).ctx.plot();
    const axisTransforms: Record<string, string | null> = {};
    for (const g of Array.from(chartEl.querySelectorAll('.cngx-axis'))) {
      const side = (g.getAttribute('class') ?? '').split('cngx-axis--')[1] ?? '?';
      axisTransforms[side] = g.getAttribute('transform');
    }
    return { chartEl, plot, geometries, axisTransforms };
  }

  it('spans threshold and band across the plot in canvas mode, where the axes are', () => {
    const { chartEl, plot, geometries, axisTransforms } = mount(51);
    // Precondition: we are actually on the canvas backend.
    expect(chartEl.querySelector('canvas')).not.toBeNull();
    expect(chartEl.querySelector('.cngx-line')).toBeNull();

    const threshold = geometries.find((g) => g.kind === 'threshold');
    const band = geometries.find((g) => g.kind === 'band');
    expect(threshold).toBeDefined();
    expect(band).toBeDefined();
    if (threshold?.kind !== 'threshold' || band?.kind !== 'band') {
      throw new Error('unreachable');
    }

    // The geometries the canvas paints start and end on the plot edges.
    expect(threshold.x1).toBe(plot.x0);
    expect(threshold.x2).toBe(plot.x1);
    expect(band.x).toBe(plot.x0);
    expect(band.x + band.w).toBe(plot.x1);

    // And the axes - which stay SVG in canvas mode - sit on those same
    // edges. This is the pairing that makes the two paths agree.
    expect(axisTransforms['left']).toBe(`translate(${plot.x0},0)`);
    expect(axisTransforms['bottom']).toBe(`translate(0,${plot.y1})`);
  });

  it('publishes identical geometry either side of the threshold crossover', () => {
    const svgSide = mount(10);
    expect(svgSide.chartEl.querySelector('canvas')).toBeNull();
    const canvasSide = mount(51);
    expect(canvasSide.chartEl.querySelector('canvas')).not.toBeNull();

    // Same box, same axes, so the same plot - the backend swap changes
    // who paints, never where.
    expect(canvasSide.plot).toEqual(svgSide.plot);
    expect(canvasSide.axisTransforms).toEqual(svgSide.axisTransforms);

    const pick = (gs: readonly LayerGeometry[]) =>
      gs
        .filter((g) => g.kind === 'threshold' || g.kind === 'band')
        .map((g) => (g.kind === 'threshold' ? [g.x1, g.x2, g.y1] : [g.x, g.x + g.w, g.y]));
    expect(pick(canvasSide.geometries)).toEqual(pick(svgSide.geometries));
  });
});

describe('CngxChart - slot templates see the plot they sit inside', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('hands the plot rectangle to the slot context', async () => {
    // A fallback centred on width/height alone sits off-centre from the
    // marks it stands in for, now that the box is not the plot.
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxChartEmpty],
      template: `
        <cngx-chart [data]="[]" [state]="state" [width]="200" [height]="100">
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 100]"></svg:g>
          <ng-template cngxChartEmpty let-plot="plot">
            <span class="probe">{{ plot.x0 }}/{{ plot.width }}/{{ plot.height }}</span>
          </ng-template>
        </cngx-chart>
      `,
    })
    class SlotHost {
      readonly state = createManualState<readonly number[]>();
    }
    TestBed.configureTestingModule({ imports: [SlotHost] });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.componentInstance.state.setSuccess([]);
    fixture.detectChanges();
    const probe = (fixture.nativeElement as HTMLElement).querySelector('.probe');
    // Lone left axis over [0, 100]: 31 inline-start, 9 on each block side.
    expect(probe?.textContent?.trim()).toBe('31/169/82');
  });
});
