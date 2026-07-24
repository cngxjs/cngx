import { effect, EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { type CngxChartSummary } from '../i18n/chart-i18n';
import { createSignificantChangeTracker } from './significant-change';

function summaryOf(over: Partial<CngxChartSummary>): CngxChartSummary {
  return { trend: 'flat', min: 0, max: 100, current: 50, thresholds: [], ...over };
}

function track(seed: CngxChartSummary): {
  source: ReturnType<typeof signal<CngxChartSummary>>;
  tracker: ReturnType<typeof createSignificantChangeTracker>;
} {
  const source = signal<CngxChartSummary>(seed);
  const tracker = TestBed.runInInjectionContext(() => createSignificantChangeTracker(source));
  return { source, tracker };
}

describe('createSignificantChangeTracker', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('is null on the initial seed', () => {
    const { tracker } = track(summaryOf({}));
    expect(tracker()).toBeNull();
  });

  it('emits a trend-flip when the summary trend transitions', () => {
    const { source, tracker } = track(summaryOf({ trend: 'flat' }));
    expect(tracker()).toBeNull();
    source.set(summaryOf({ trend: 'up' }));
    expect(tracker()).toEqual({ kind: 'trend-flip', from: 'flat', to: 'up' });
  });

  it('emits a threshold-cross in both directions', () => {
    const { source, tracker } = track(summaryOf({ current: 50, thresholds: [80] }));
    expect(tracker()).toBeNull();

    source.set(summaryOf({ current: 90, thresholds: [80] }));
    expect(tracker()).toEqual({ kind: 'threshold-cross', threshold: 80, direction: 'up' });

    source.set(summaryOf({ current: 50, thresholds: [80] }));
    expect(tracker()).toEqual({ kind: 'threshold-cross', threshold: 80, direction: 'down' });
  });

  it('returns null for a non-significant update (flat trend, no crossing)', () => {
    const { source, tracker } = track(summaryOf({ current: 50, trend: 'flat' }));
    source.set(summaryOf({ current: 55, trend: 'flat' }));
    expect(tracker()).toBeNull();
  });

  it('short-circuits a downstream effect when consecutive updates stay non-significant', () => {
    const { source, tracker } = track(summaryOf({ current: 50, trend: 'flat' }));
    const env = TestBed.inject(EnvironmentInjector);
    let runs = 0;
    runInInjectionContext(env, () => {
      effect(() => {
        tracker();
        runs++;
      });
    });
    TestBed.tick();
    const base = runs;

    source.set(summaryOf({ current: 60, trend: 'flat' })); // still null -> equal short-circuits
    TestBed.tick();
    expect(runs).toBe(base);

    source.set(summaryOf({ current: 80, trend: 'up' })); // genuine flip -> re-fires
    TestBed.tick();
    expect(runs).toBeGreaterThan(base);
  });
});
