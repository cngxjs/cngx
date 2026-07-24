import { signal, type DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { type CngxChartContext } from '../chart/chart-context';
import { type ChartRendererDeps, type CngxChartRenderer, type CngxChartRendererFactory } from './chart-renderer';
import {
  CNGX_CHART_RENDERER_FACTORY,
  createDefaultChartRenderer,
  provideChartRenderer,
  withChartRendererFactory,
  withChartRendererThreshold,
} from './renderer-factory';
import { CNGX_CHART_RENDERER_THRESHOLD } from './renderer-threshold';

const noop = (): void => undefined;
const fakeRenderer: CngxChartRenderer = { mode: 'svg', mount: noop, paint: noop, destroy: noop };
const fakeFactory: CngxChartRendererFactory = () => fakeRenderer;

function fakeDeps(): ChartRendererDeps {
  const ctx = { dimensions: signal({ width: 10, height: 10 }) } as unknown as CngxChartContext;
  const destroyRef = { onDestroy: noop } as unknown as DestroyRef;
  return { ctx, destroyRef };
}

describe('provideChartRenderer', () => {
  it('withChartRendererThreshold overrides the threshold token', () => {
    TestBed.configureTestingModule({
      providers: [provideChartRenderer(withChartRendererThreshold(2000))],
    });
    expect(TestBed.inject(CNGX_CHART_RENDERER_THRESHOLD)).toBe(2000);
  });

  it('withChartRendererFactory overrides the factory token', () => {
    TestBed.configureTestingModule({
      providers: [provideChartRenderer(withChartRendererFactory(fakeFactory))],
    });
    expect(TestBed.inject(CNGX_CHART_RENDERER_FACTORY)).toBe(fakeFactory);
  });

  it('applies both features in a combined call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideChartRenderer(withChartRendererThreshold(750), withChartRendererFactory(fakeFactory)),
      ],
    });
    expect(TestBed.inject(CNGX_CHART_RENDERER_THRESHOLD)).toBe(750);
    expect(TestBed.inject(CNGX_CHART_RENDERER_FACTORY)).toBe(fakeFactory);
  });
});

describe('createDefaultChartRenderer', () => {
  it('dispatches svg and canvas backends by mode', () => {
    const deps = fakeDeps();
    expect(createDefaultChartRenderer('svg', deps).mode).toBe('svg');
    expect(createDefaultChartRenderer('canvas', deps).mode).toBe('canvas');
  });
});
