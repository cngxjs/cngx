import { computed, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from './axis.component';
import { CngxChart } from '../chart/chart.component';
import {
  CNGX_CHART_CONTEXT,
  type CngxChartContext,
  type CngxChartPlotArea,
  type ScaleFn,
  type XScaleInput,
} from '../chart/chart-context';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis],
  template: `
    <cngx-chart [data]="data()" [width]="width()" [height]="height()">
      <svg:g
        cngxAxis
        [position]="position()"
        [type]="axisType()"
        [domain]="domain()"
        [ticks]="tickCount()"
        [format]="formatFn()"
      ></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  width = signal<number | undefined>(200);
  height = signal<number | undefined>(100);
  position = signal<CngxAxisPosition>('bottom');
  axisType = signal<CngxAxisType>('linear');
  domain = signal<readonly unknown[] | undefined>([0, 100]);
  tickCount = signal<number | undefined>(undefined);
  formatFn = signal<(v: unknown) => string>((v) => String(v));
}

describe('CngxAxis', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    axisGroup: SVGGElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const axisGroup = fixture.nativeElement.querySelector('.cngx-axis') as SVGGElement;
    return { fixture, axisGroup };
  }

  it('renders a line and 5 ticks for a linear axis with default tickCount', () => {
    const { axisGroup } = setup();
    expect(axisGroup).not.toBeNull();
    expect(axisGroup.querySelector('.cngx-axis__line')).not.toBeNull();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(5);
  });

  it('respects an explicit [ticks] count', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.tickCount.set(3);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(3);
  });

  it('applies the [format] callback to tick labels', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.tickCount.set(2);
    fixture.componentInstance.formatFn.set((v) => `[${v}]`);
    fixture.detectChanges();
    const labels = Array.from(
      axisGroup.querySelectorAll<SVGTextElement>('.cngx-axis__tick-label'),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['[0]', '[100]']);
  });

  // The host's 200x100 box with a [0, 100] domain formats to a longest
  // tick label of three characters, so a vertical axis reserves 30 and
  // a horizontal one the 20 its single line box needs.
  it.each<[CngxAxisPosition, string]>([
    ['top', 'translate(0,20)'],
    ['bottom', 'translate(0,80)'],
    ['left', 'translate(30,0)'],
    ['right', 'translate(170,0)'],
  ])('positions the axis group on its own reserved plot edge for position=%s', (pos, expected) => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.position.set(pos);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.cngx-axis') as SVGGElement;
    expect(group.getAttribute('transform')).toBe(expected);
    expect(group.classList.contains(`cngx-axis--${pos}`)).toBe(true);
    void axisGroup;
  });

  it('emits one tick per band value when type=band', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.axisType.set('band');
    fixture.componentInstance.domain.set(['Mon', 'Tue', 'Wed', 'Thu']);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(4);
    const labels = Array.from(
      axisGroup.querySelectorAll<SVGTextElement>('.cngx-axis__tick-label'),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu']);
  });

  it('renders no ticks when [domain] is missing for linear/time axes', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.domain.set(undefined);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(0);
    // The axis line still renders.
    expect(axisGroup.querySelector('.cngx-axis__line')).not.toBeNull();
  });

  it('default tick formatter strips floating-point noise from non-integer values', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6"></svg:g>
        </cngx-chart>
      `,
    })
    class FormatHost {}
    TestBed.configureTestingModule({ imports: [FormatHost] });
    const f = TestBed.createComponent(FormatHost);
    f.detectChanges();
    const labels = Array.from(
      (f.nativeElement as HTMLElement).querySelectorAll<SVGTextElement>('.cngx-axis__tick-label'),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['0', '2.2', '4.4', '6.6', '8.8', '11']);
    // Without the fix the third label would render as
    // `6.6000000000000005`, which is the symptom of accumulated
    // float arithmetic from the linear-spread tick generator.
    for (const label of labels) {
      expect(label).not.toMatch(/\d{6,}/);
    }
  });

  it('does NOT render an axis-label text element by default', () => {
    const { fixture } = setup();
    const label = fixture.nativeElement.querySelector('.cngx-axis__axis-label');
    expect(label).toBeNull();
  });

  it('renders the axis-label text when [label] is set, positioned by axis side', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]" label="Months"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]" label="Revenue"></svg:g>
        </cngx-chart>
      `,
    })
    class LabelHost {}
    TestBed.configureTestingModule({ imports: [LabelHost] });
    const f = TestBed.createComponent(LabelHost);
    f.detectChanges();
    const labels = Array.from(
      (f.nativeElement as HTMLElement).querySelectorAll<SVGTextElement>('.cngx-axis__axis-label'),
    );
    expect(labels.length).toBe(2);
    const texts = labels.map((l) => l.textContent?.trim());
    expect(texts).toContain('Months');
    expect(texts).toContain('Revenue');
    // Bottom axis label is centred on the plot, not the box: the
    // titled left axis reserves 48, so the plot runs x 48..200 and its
    // midpoint is 124. No rotation in the transform.
    const bottomLabel = labels.find((l) => l.textContent?.trim() === 'Months');
    expect(bottomLabel?.getAttribute('transform')).toMatch(/translate\(124,/);
    expect(bottomLabel?.getAttribute('transform')).not.toMatch(/rotate/);
    // Left axis label is rotated -90deg.
    const leftLabel = labels.find((l) => l.textContent?.trim() === 'Revenue');
    expect(leftLabel?.getAttribute('transform')).toMatch(/rotate\(-90\)/);
  });

  it('emits no gridlines by default', () => {
    const { fixture } = setup();
    const grid = fixture.nativeElement.querySelectorAll('.cngx-axis__grid-line');
    expect(grid.length).toBe(0);
    void fixture;
  });

  it('emits one gridline per tick when [grid] is true (bottom axis renders vertical gridlines)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.tickCount.set(5);
    fixture.detectChanges();
    // Re-render with grid on by replacing the host with a separate
    // grid-on host since the existing test host does not bind [grid].
    TestBed.resetTestingModule();
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g
            cngxAxis
            position="bottom"
            type="linear"
            [domain]="[0, 100]"
            [ticks]="5"
            [grid]="true"
          ></svg:g>
        </cngx-chart>
      `,
    })
    class GridHost {}
    TestBed.configureTestingModule({ imports: [GridHost] });
    const f2 = TestBed.createComponent(GridHost);
    f2.detectChanges();
    const lines = Array.from(
      (f2.nativeElement as HTMLElement).querySelectorAll<SVGLineElement>('.cngx-axis__grid-line'),
    );
    expect(lines.length).toBe(5);
    // Vertical gridlines for a bottom axis: x2=0, y2=-plot height. The
    // bottom axis reserves 20 of the 100-tall box, so they stop at the
    // plot edge rather than running down through the tick labels.
    for (const l of lines) {
      expect(Number(l.getAttribute('x2'))).toBe(0);
      expect(Number(l.getAttribute('y2'))).toBe(-80);
    }
  });

  it('emits horizontal gridlines for a left axis (gridLine x2=width, y2=0)', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis],
      template: `
        <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
          <svg:g
            cngxAxis
            position="left"
            type="linear"
            [domain]="[0, 10]"
            [ticks]="3"
            [grid]="true"
          ></svg:g>
        </cngx-chart>
      `,
    })
    class LeftGridHost {}
    TestBed.configureTestingModule({ imports: [LeftGridHost] });
    const f = TestBed.createComponent(LeftGridHost);
    f.detectChanges();
    const lines = Array.from(
      (f.nativeElement as HTMLElement).querySelectorAll<SVGLineElement>('.cngx-axis__grid-line'),
    );
    expect(lines.length).toBe(3);
    // A [0, 10] domain over 3 ticks formats to '2.5' at its widest, so
    // the left axis reserves 23 of the 200-wide box.
    for (const l of lines) {
      expect(Number(l.getAttribute('x2'))).toBe(177);
      expect(Number(l.getAttribute('y2'))).toBe(0);
    }
  });

  it('spans the axis line across the full box width when no axis reserves inline room', () => {
    const { fixture } = setup();
    fixture.componentInstance.position.set('bottom');
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.cngx-axis__line') as SVGLineElement;
    // A lone bottom axis reserves on block-end only, so the inline
    // extent is untouched.
    expect(Number(line.getAttribute('x1'))).toBe(0);
    expect(Number(line.getAttribute('x2'))).toBe(200);
  });

  it('produces evenly spaced linear ticks across the domain', () => {
    const { fixture } = setup();
    fixture.componentInstance.tickCount.set(5);
    fixture.componentInstance.domain.set([0, 100]);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGTextElement>(
        '.cngx-axis__tick-label',
      ),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['0', '25', '50', '75', '100']);
  });
});

/**
 * Non-zero inset is not reachable through `<cngx-chart>` yet - the
 * chart's own `inset` computed is constant-zero at this point. The
 * context is an exported injection token, though, so a hand-rolled
 * provider reaches the axis half of the plumbing without a test-only
 * seam on the chart.
 */
describe('CngxAxis — non-zero plot inset', () => {
  // Box 200x100 with 30/10 inline and 8/20 block reserved.
  const PLOT: CngxChartPlotArea = {
    x0: 30,
    y0: 8,
    x1: 190,
    y1: 80,
    width: 160,
    height: 72,
  };
  const WIDTH = 200;
  const HEIGHT = 100;

  @Component({
    standalone: true,
    imports: [CngxAxis],
    template: `
      <svg [attr.viewBox]="'0 0 200 100'">
        <svg:g
          cngxAxis
          [position]="position()"
          type="linear"
          [domain]="[0, 100]"
          [ticks]="3"
          [grid]="true"
        ></svg:g>
      </svg>
    `,
    providers: [
      {
        provide: CNGX_CHART_CONTEXT,
        useFactory: (): CngxChartContext => ({
          xScale: signal<ScaleFn<XScaleInput>>((v) => 30 + (Number(v) / 100) * 160),
          yScale: signal<ScaleFn<number>>((v) => 80 - (v / 100) * 72),
          dimensions: signal({ width: WIDTH, height: HEIGHT }),
          plot: signal(PLOT),
          dataLength: computed(() => 0),
          data: <T>() => [] as readonly T[],
          renderSvg: signal(true),
        }),
      },
    ],
  })
  class InsetHost {
    position = signal<CngxAxisPosition>('bottom');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InsetHost] });
  });

  function setup(pos: CngxAxisPosition): {
    group: SVGGElement;
    line: SVGLineElement;
  } {
    const fixture = TestBed.createComponent(InsetHost);
    fixture.componentInstance.position.set(pos);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return {
      group: host.querySelector('.cngx-axis') as SVGGElement,
      line: host.querySelector('.cngx-axis__line') as SVGLineElement,
    };
  }

  it.each<[CngxAxisPosition, string]>([
    ['top', 'translate(0,8)'],
    ['bottom', 'translate(0,80)'],
    ['left', 'translate(30,0)'],
    ['right', 'translate(190,0)'],
  ])('places the %s axis on the plot edge, not the box edge', (pos, expected) => {
    expect(setup(pos).group.getAttribute('transform')).toBe(expected);
  });

  it.each<[CngxAxisPosition]>([['top'], ['bottom']])(
    'spans the %s axis line across the plot width',
    (pos) => {
      const { line } = setup(pos);
      expect(Number(line.getAttribute('x1'))).toBe(30);
      expect(Number(line.getAttribute('x2'))).toBe(190);
    },
  );

  it.each<[CngxAxisPosition]>([['left'], ['right']])(
    'spans the %s axis line across the plot height',
    (pos) => {
      const { line } = setup(pos);
      expect(Number(line.getAttribute('y1'))).toBe(8);
      expect(Number(line.getAttribute('y2'))).toBe(80);
    },
  );

  it('extends bottom-axis gridlines across the plot height, not the box height', () => {
    const fixture = TestBed.createComponent(InsetHost);
    fixture.detectChanges();
    const lines = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGLineElement>(
        '.cngx-axis__grid-line',
      ),
    );
    expect(lines.length).toBe(3);
    for (const l of lines) {
      expect(Number(l.getAttribute('y2'))).toBe(-72);
    }
  });

  it('extends left-axis gridlines across the plot width, not the box width', () => {
    const fixture = TestBed.createComponent(InsetHost);
    fixture.componentInstance.position.set('left');
    fixture.detectChanges();
    const lines = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGLineElement>(
        '.cngx-axis__grid-line',
      ),
    );
    expect(lines.length).toBe(3);
    for (const l of lines) {
      expect(Number(l.getAttribute('x2'))).toBe(160);
    }
  });

  it('renders nothing once the inset exceeds the box on either dimension', () => {
    @Component({
      standalone: true,
      imports: [CngxAxis],
      template: `
        <svg [attr.viewBox]="'0 0 20 100'">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 100]"></svg:g>
        </svg>
      `,
      providers: [
        {
          provide: CNGX_CHART_CONTEXT,
          useFactory: (): CngxChartContext => ({
            xScale: signal<ScaleFn<XScaleInput>>(() => 0),
            yScale: signal<ScaleFn<number>>(() => 0),
            dimensions: signal({ width: 20, height: HEIGHT }),
            // Reserving 30+10 inline inside a 20px box collapses the plot.
            plot: signal({ ...PLOT, x0: 30, x1: 10, width: -20 }),
            dataLength: computed(() => 0),
            data: <T>() => [] as readonly T[],
            renderSvg: signal(true),
          }),
        },
      ],
    })
    class CollapsedHost {}
    TestBed.configureTestingModule({ imports: [CollapsedHost] });
    const fixture = TestBed.createComponent(CollapsedHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.cngx-axis__line')).toBeNull();
    expect(host.querySelectorAll('.cngx-axis__tick').length).toBe(0);
  });
});
