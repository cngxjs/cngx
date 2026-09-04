import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { injectChartContext } from '../public-api';
import { CNGX_CHART_CONTEXT, type CngxChartContext } from './chart-context';

describe('injectChartContext', () => {
  it('is exported from the public API', () => {
    expect(typeof injectChartContext).toBe('function');
  });

  it('returns the provided context inside a chart injector', () => {
    const ctx = {} as CngxChartContext;
    const injector = Injector.create({
      providers: [{ provide: CNGX_CHART_CONTEXT, useValue: ctx }],
      parent: TestBed.inject(Injector),
    });
    const resolved = runInInjectionContext(injector, () => injectChartContext('SpecConsumer'));
    expect(resolved).toBe(ctx);
  });

  it('throws a consumer-named error outside <cngx-chart>', () => {
    expect(() =>
      runInInjectionContext(TestBed.inject(Injector), () => injectChartContext('SpecConsumer')),
    ).toThrowError(/SpecConsumer.*CNGX_CHART_CONTEXT.*content child of <cngx-chart>/);
  });
});
