import {
  Component,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
  signal,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from './chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from '../layers/line.component';
import { CngxThreshold } from '../layers/threshold.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxLine, CngxThreshold],
  template: `
    <cngx-chart [data]="data()" [width]="width()" [height]="height()">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 4]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxThreshold [value]="5"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  width = signal<number | undefined>(200);
  height = signal<number | undefined>(100);
}

describe('Chart graph cascade — reference-stability invariant', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const chartDe = fixture.debugElement.query(By.directive(CngxChart));
    const chart = chartDe.componentInstance as CngxChart<number>;
    return { fixture, chart };
  }

  function probe<V>(getter: () => V, env: EnvironmentInjector): { runs: () => number } {
    let runs = 0;
    runInInjectionContext(env, () => {
      effect(() => {
        getter();
        runs++;
      });
    });
    TestBed.tick();
    return { runs: () => runs };
  }

  it('summary identity is stable when data swaps to a fresh-reference array of identical values', () => {
    const { fixture, chart } = setup();
    const env = TestBed.inject(EnvironmentInjector);
    const summarySig = (chart as unknown as { summary: Signal<unknown> }).summary;
    const summaryProbe = probe(() => summarySig(), env);
    const baseline = summaryProbe.runs();

    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();

    expect(summaryProbe.runs()).toBe(baseline);
  });

  it('summaryValues identity is stable across same-content data swaps', () => {
    const { fixture, chart } = setup();
    const env = TestBed.inject(EnvironmentInjector);
    const summaryValuesSig = (chart as unknown as { summaryValues: Signal<readonly number[]> })
      .summaryValues;
    const valuesProbe = probe(() => summaryValuesSig(), env);
    const baseline = valuesProbe.runs();

    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();

    expect(valuesProbe.runs()).toBe(baseline);
  });

  it('dimensions identity is stable across redundant width/height re-emissions', () => {
    const { fixture, chart } = setup();
    const env = TestBed.inject(EnvironmentInjector);
    const dimensionsSig = chart.dimensions;
    const dimsProbe = probe(() => dimensionsSig(), env);
    const baseline = dimsProbe.runs();

    fixture.componentInstance.width.set(200);
    fixture.componentInstance.height.set(100);
    fixture.detectChanges();
    TestBed.tick();

    expect(dimsProbe.runs()).toBe(baseline);
  });

  it('xScale and yScale identities are stable when dimensions and axes are unchanged', () => {
    const { fixture, chart } = setup();
    const env = TestBed.inject(EnvironmentInjector);
    const xProbe = probe(() => chart.xScale(), env);
    const yProbe = probe(() => chart.yScale(), env);
    const baselineX = xProbe.runs();
    const baselineY = yProbe.runs();

    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();

    expect(xProbe.runs()).toBe(baselineX);
    expect(yProbe.runs()).toBe(baselineY);
  });

  it('xScale and yScale identities DO flip when dimensions actually change (sanity)', () => {
    const { fixture, chart } = setup();
    const env = TestBed.inject(EnvironmentInjector);
    const xProbe = probe(() => chart.xScale(), env);
    const baseline = xProbe.runs();

    fixture.componentInstance.width.set(400);
    fixture.detectChanges();
    TestBed.tick();

    expect(xProbe.runs()).toBeGreaterThan(baseline);
  });
});
