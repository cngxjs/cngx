import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CNGX_CHART_I18N, provideChartI18n, type CngxChartI18n } from './chart-i18n';

describe('CNGX_CHART_I18N', () => {
  it('resolves to English defaults when no override is provided', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N);
    expect(i18n.empty()).toBe('No data');
    expect(i18n.loading()).toBe('Loading');
    expect(i18n.error()).toBe('Error loading chart');
    expect(i18n.dataTable()).toBe('Data table');
  });

  it('formats a typical summary string with all sections', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N);
    const text = i18n.summary({
      trend: 'up',
      min: 5,
      max: 50,
      current: 38,
      thresholds: [42],
    });
    expect(text).toBe('Trending up. Min 5, max 50, current 38. One threshold crossing.');
  });

  it('uses the singular threshold form for zero / one and plural for many', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N);
    expect(i18n.summary({ trend: 'flat', min: 0, max: 0, current: 0, thresholds: [] })).toContain(
      'No thresholds.',
    );
    expect(
      i18n.summary({ trend: 'flat', min: 0, max: 0, current: 0, thresholds: [1, 2, 3] }),
    ).toContain('3 threshold crossings.');
  });

  it('resolves to the override values when provideChartI18n is used', () => {
    const override: CngxChartI18n = {
      summary: () => 'OVERRIDDEN',
      dataTable: () => 'TABLE_OVR',
      trendChanged: () => 'TREND_OVR',
      thresholdAlert: () => 'THRESHOLD_OVR',
      empty: () => 'EMPTY_OVR',
      loading: () => 'LOADING_OVR',
      error: () => 'ERROR_OVR',
    };
    TestBed.configureTestingModule({
      providers: [provideChartI18n(override)],
    });
    const i18n = TestBed.inject(CNGX_CHART_I18N);
    expect(i18n.empty()).toBe('EMPTY_OVR');
    expect(i18n.summary({ trend: 'up', min: 0, max: 0, current: 0, thresholds: [] })).toBe(
      'OVERRIDDEN',
    );
  });

  it('returns the trend-changed string keyed by direction', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N);
    expect(i18n.trendChanged('up')).toBe('Trend changed to up');
    expect(i18n.trendChanged('down')).toBe('Trend changed to down');
    expect(i18n.trendChanged('flat')).toBe('Trend flattened');
  });
});
