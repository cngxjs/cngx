import {
  Component,
  computed,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CNGX_CHART_CONTEXT,
  type CngxChartContext,
  type ScaleFn,
  type XScaleInput,
} from '../chart/chart-context';
import { CngxArea } from './area.component';
import { CngxBand } from './band.component';
import { CngxBar } from './bar.component';
import { CngxLine } from './line.component';
import { CngxScatter } from './scatter.component';
import { CngxThreshold } from './threshold.component';

interface MockCtxHandle {
  readonly ctx: CngxChartContext;
  readonly renderSvg: WritableSignal<boolean>;
  readonly dims: WritableSignal<{ width: number; height: number }>;
  readonly data: WritableSignal<readonly number[]>;
}

function mkCtx(): MockCtxHandle {
  const renderSvg = signal(true);
  const dims = signal({ width: 100, height: 50 });
  const dataSig = signal<readonly number[]>([1, 2, 3, 4, 5]);
  const xScale = signal<ScaleFn<XScaleInput>>((v) => Number(v) * 10);
  const yScale = signal<ScaleFn<number>>((v) => v * 4);
  const ctx: CngxChartContext = {
    xScale,
    yScale,
    dimensions: dims,
    dataLength: computed(() => dataSig().length),
    data: <T>() => dataSig() as unknown as readonly T[],
    renderSvg,
  };
  return { ctx, renderSvg, dims, data: dataSig };
}

@Component({
  standalone: true,
  imports: [CngxLine, CngxArea, CngxBar, CngxScatter, CngxThreshold, CngxBand],
  template: `
    <svg>
      <svg:g cngxLine></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxBar></svg:g>
      <svg:g cngxScatter [x]="xAcc" [y]="yAcc"></svg:g>
      <svg:g cngxThreshold [value]="3"></svg:g>
      <svg:g cngxBand [from]="1" [to]="4"></svg:g>
    </svg>
  `,
})
class AllLayersHost {
  readonly xAcc = (_d: number, i: number): number => i;
  readonly yAcc = (d: number): number => d;
}

describe('layer geometry contract', () => {
  let handle: MockCtxHandle;

  beforeEach(() => {
    handle = mkCtx();
    TestBed.configureTestingModule({
      imports: [AllLayersHost],
      providers: [{ provide: CNGX_CHART_CONTEXT, useValue: handle.ctx }],
    });
  });

  function render(): ReturnType<typeof TestBed.createComponent<AllLayersHost>> {
    const fixture = TestBed.createComponent(AllLayersHost);
    fixture.detectChanges();
    return fixture;
  }

  function layerOf<C>(
    fixture: ReturnType<typeof TestBed.createComponent<AllLayersHost>>,
    type: abstract new (...args: never[]) => C,
  ): C {
    return fixture.debugElement.query((el) => el.componentInstance instanceof type)
      .componentInstance as C;
  }

  it('publishes geometry matching each layer kind and projection', () => {
    const fixture = render();

    const lineGeom = layerOf(fixture, CngxLine).geometry();
    expect(lineGeom.kind).toBe('line');
    if (lineGeom.kind === 'line') {
      expect(lineGeom.d.startsWith('M')).toBe(true);
      expect(lineGeom.fill).toBe('none');
    }

    expect(layerOf(fixture, CngxArea).geometry().kind).toBe('area');

    const barGeom = layerOf(fixture, CngxBar).geometry();
    expect(barGeom.kind).toBe('bar');
    if (barGeom.kind === 'bar') {
      expect(barGeom.rects.length).toBe(5);
    }

    const scatterGeom = layerOf(fixture, CngxScatter).geometry();
    expect(scatterGeom.kind).toBe('scatter');
    if (scatterGeom.kind === 'scatter') {
      expect(scatterGeom.marks.length).toBe(5);
      expect(scatterGeom.marks[0].r).toBe(3);
    }

    const thresholdGeom = layerOf(fixture, CngxThreshold).geometry();
    expect(thresholdGeom.kind).toBe('threshold');
    if (thresholdGeom.kind === 'threshold') {
      expect(thresholdGeom.x1).toBe(0);
      expect(thresholdGeom.x2).toBe(100);
      expect(thresholdGeom.y1).toBe(thresholdGeom.y2);
    }

    const bandGeom = layerOf(fixture, CngxBand).geometry();
    expect(bandGeom.kind).toBe('band');
    if (bandGeom.kind === 'band') {
      expect(bandGeom.w).toBe(100);
      expect(bandGeom.h).toBeGreaterThan(0);
    }
  });

  it('gates SVG output behind ctx.renderSvg() while geometry keeps emitting', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.cngx-line')).not.toBeNull();
    expect(host.querySelector('.cngx-area')).not.toBeNull();
    expect(host.querySelector('.cngx-bar')).not.toBeNull();
    expect(host.querySelector('.cngx-scatter')).not.toBeNull();
    expect(host.querySelector('.cngx-threshold__line')).not.toBeNull();
    expect(host.querySelector('.cngx-band__rect')).not.toBeNull();

    handle.renderSvg.set(false);
    fixture.detectChanges();

    expect(host.querySelector('.cngx-line')).toBeNull();
    expect(host.querySelector('.cngx-area')).toBeNull();
    expect(host.querySelector('.cngx-bar')).toBeNull();
    expect(host.querySelector('.cngx-scatter')).toBeNull();
    expect(host.querySelector('.cngx-threshold__line')).toBeNull();
    expect(host.querySelector('.cngx-band__rect')).toBeNull();

    // The geometry signal is independent of the SVG gate: it still emits.
    expect(layerOf(fixture, CngxLine).geometry().kind).toBe('line');
    expect(layerOf(fixture, CngxBar).geometry().kind).toBe('bar');
  });

  it('short-circuits a structurally-identical geometry, re-fires a genuine change', () => {
    const fixture = render();
    const line = layerOf(fixture, CngxLine);
    const bar = layerOf(fixture, CngxBar);
    const env = TestBed.inject(EnvironmentInjector);

    let lineRuns = 0;
    let barRuns = 0;
    runInInjectionContext(env, () => {
      effect(() => {
        line.geometry();
        lineRuns++;
      });
      effect(() => {
        bar.geometry();
        barRuns++;
      });
    });
    TestBed.tick();
    const lineBase = lineRuns;
    const barBase = barRuns;

    // Fresh-reference array, identical values, unchanged scales/dims: the
    // geometry recomputes to a structurally-identical object, so the equal
    // fn short-circuits the downstream effect.
    handle.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();
    expect(lineRuns).toBe(lineBase);
    expect(barRuns).toBe(barBase);

    // A genuine change flows through.
    handle.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    TestBed.tick();
    expect(lineRuns).toBeGreaterThan(lineBase);
    expect(barRuns).toBeGreaterThan(barBase);
  });
});
