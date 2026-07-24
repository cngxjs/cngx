import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import {
  CNGX_LOADING_DEFAULTS,
  injectLoadingConfig,
  provideLoadingConfig,
  provideLoadingConfigAt,
  withMinDwell,
  withShowDelay,
  withSpinnerVsSkeletonCutoff,
} from './loading-config';

describe('CNGX_LOADING_CONFIG cascade', () => {
  function inject() {
    return TestBed.runInInjectionContext(() => injectLoadingConfig());
  }

  it('exposes the library defaults without any provider', () => {
    expect(inject()).toEqual({ showDelay: 120, minDwell: 400, spinnerVsSkeletonCutoff: 800 });
    expect(CNGX_LOADING_DEFAULTS).toEqual({
      showDelay: 120,
      minDwell: 400,
      spinnerVsSkeletonCutoff: 800,
    });
  });

  it('withShowDelay overrides only the delay', () => {
    TestBed.configureTestingModule({ providers: [provideLoadingConfig(withShowDelay(300))] });
    expect(inject()).toEqual({ showDelay: 300, minDwell: 400, spinnerVsSkeletonCutoff: 800 });
  });

  it('withMinDwell overrides only the dwell', () => {
    TestBed.configureTestingModule({ providers: [provideLoadingConfig(withMinDwell(600))] });
    expect(inject()).toEqual({ showDelay: 120, minDwell: 600, spinnerVsSkeletonCutoff: 800 });
  });

  it('withSpinnerVsSkeletonCutoff overrides only the cutoff', () => {
    TestBed.configureTestingModule({
      providers: [provideLoadingConfig(withSpinnerVsSkeletonCutoff(1200))],
    });
    expect(inject()).toEqual({ showDelay: 120, minDwell: 400, spinnerVsSkeletonCutoff: 1200 });
  });

  it('composes multiple features', () => {
    TestBed.configureTestingModule({
      providers: [
        provideLoadingConfig(withShowDelay(0), withMinDwell(0), withSpinnerVsSkeletonCutoff(0)),
      ],
    });
    expect(inject()).toEqual({ showDelay: 0, minDwell: 0, spinnerVsSkeletonCutoff: 0 });
  });

  it('provideLoadingConfigAt yields the same resolved config for a component scope', () => {
    TestBed.configureTestingModule({
      providers: [provideLoadingConfigAt(withShowDelay(50))],
    });
    expect(inject()).toEqual({ showDelay: 50, minDwell: 400, spinnerVsSkeletonCutoff: 800 });
  });

  it('never exposes the frozen CNGX_LOADING_DEFAULTS const for mutation', () => {
    const config = inject();
    config.showDelay = 999;
    expect(CNGX_LOADING_DEFAULTS.showDelay).toBe(120);
  });
});
