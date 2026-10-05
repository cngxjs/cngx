import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_KPI_I18N, provideKpiI18n, withKpiI18nLabels } from '../display/shared/kpi-i18n';
import {
  CNGX_RECYCLER_I18N,
  provideRecyclerI18n,
  withRecyclerI18nLabels,
} from '../recycler/recycler';

describe('kpi language section', () => {
  it('derives the pre-section English copy from the English section', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('en-US')] });
    const i18n = TestBed.inject(CNGX_KPI_I18N)();
    expect(stripBidiIsolates(i18n.deltaLabel('+5.3%', 'positive'))).toBe('+5.3% improved');
    expect(stripBidiIsolates(i18n.deltaLabel('2%', 'negative'))).toBe('2% declined');
    expect(stripBidiIsolates(i18n.deltaLabel('0', 'neutral'))).toBe('0 unchanged');
    expect(stripBidiIsolates(i18n.trendLabel('1%', 'up'))).toBe('1% up');
    expect(stripBidiIsolates(i18n.trendLabel('1%', 'down'))).toBe('1% down');
    expect(stripBidiIsolates(i18n.trendLabel('0%', 'flat'))).toBe('0% unchanged');
    expect(stripBidiIsolates(i18n.goalValueText(73, 100))).toBe('73 of 100');
    expect(i18n.metricValueWithUnit).toBe('{value} {unit}');
    expect(i18n.metricNoValue).toBe('No value');
  });

  it('reads the kpi section of the active pack and formats goal numbers in its locale', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.inject(CNGX_KPI_I18N);
    pack.set({ locale: 'de', kpi: { goalValueText: '{now} von {max}', deltaImproved: 'besser' } });
    expect(stripBidiIsolates(bundle().goalValueText(1234.5, 2000))).toBe('1.234,5 von 2.000');
    expect(stripBidiIsolates(bundle().deltaLabel('+1 %', 'positive'))).toBe('+1 % besser');
    expect(stripBidiIsolates(bundle().trendLabel('1 %', 'up'))).toBe('1 % up');
  });

  it('applies withKpiI18nLabels on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', kpi: { trendUp: 'steigend', trendDown: 'fallend' } }),
          withDocumentLanguage('off'),
        ),
        provideKpiI18n(withKpiI18nLabels({ goalValueText: (now, max) => `${now}/${max}` })),
      ],
    });
    const i18n = TestBed.inject(CNGX_KPI_I18N)();
    expect(i18n.goalValueText(1, 2)).toBe('1/2');
    expect(stripBidiIsolates(i18n.trendLabel('1 %', 'down'))).toBe('1 % fallend');
  });
});

describe('recycler language section', () => {
  it('derives the English copy and fixes the singular', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('en-US')] });
    const i18n = TestBed.inject(CNGX_RECYCLER_I18N)();
    expect(i18n.loaded(3, 20)).toBe('3 more items loaded. 20 total.');
    expect(i18n.loaded(1, 1200)).toBe('1 more item loaded. 1,200 total.');
    expect(i18n.filtered(3)).toBe('3 results found.');
    expect(i18n.filtered(1)).toBe('1 result found.');
    expect(i18n.empty()).toBe('No results.');
    expect(i18n.error()).toBe('Error loading data.');
  });

  it('reads the recycler section of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            recycler: { filtered: { one: '{count} Treffer.', other: '{count} Treffer.' } },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_RECYCLER_I18N)();
    expect(i18n.filtered(1200)).toBe('1.200 Treffer.');
    expect(i18n.empty()).toBe('No results.');
  });

  it('lets provideRecyclerI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', recycler: { empty: 'Keine Ergebnisse.' } }),
          withDocumentLanguage('off'),
        ),
        provideRecyclerI18n(withRecyclerI18nLabels({ error: () => 'Fehler.' })),
      ],
    });
    const i18n = TestBed.inject(CNGX_RECYCLER_I18N)();
    expect(i18n.error()).toBe('Fehler.');
    expect(i18n.empty()).toBe('Keine Ergebnisse.');
  });
});
