import {
  Component,
  computed,
  createEnvironmentInjector,
  EnvironmentInjector,
  LOCALE_ID,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { describe, expect, it } from 'vitest';
import { CngxChartDataTable } from '../chart/data-table.component';
import {
  CNGX_CHART_I18N,
  createChartI18nDefaults,
  injectChartI18n,
  provideChartI18n,
  withChartI18nLabels,
  type CngxChartI18n,
} from './chart-i18n';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';
import { CNGX_CHART_LANGUAGE_EN } from './chart-language-section';

describe('CNGX_CHART_I18N', () => {
  it('resolves to English defaults when no override is provided', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    expect(i18n.empty()).toBe('No data');
    expect(i18n.loading()).toBe('Loading');
    expect(i18n.error()).toBe('Error loading chart');
    expect(i18n.dataTable()).toBe('Data table');
    expect(i18n.valueColumnLabel()).toBe('Value');
  });

  it('formats a typical summary string with all sections', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    const text = i18n.summary({
      trend: 'up',
      min: 5,
      max: 50,
      current: 38,
      thresholds: [42],
    });
    expect(stripBidiIsolates(text)).toBe(
      'Trending up. Min 5, max 50, current 38. One threshold crossing.',
    );
  });

  it('strips float-arithmetic noise from summary and threshold numbers', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    const text = i18n.summary({
      trend: 'flat',
      min: 0.30000000000000004,
      max: 6.6000000000000005,
      current: 2.2,
      thresholds: [],
    });
    expect(stripBidiIsolates(text)).toContain('Min 0.3, max 6.6, current 2.2');
    expect(text).not.toMatch(/\d{6,}/);
    expect(stripBidiIsolates(i18n.thresholdAlert(6.6000000000000005))).toBe(
      'Threshold 6.6 crossed',
    );
  });

  it('uses the singular threshold form for zero / one and plural for many', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
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
      valueColumnLabel: () => 'COL_OVR',
      trendChanged: () => 'TREND_OVR',
      thresholdAlert: () => 'THRESHOLD_OVR',
      connectionLost: () => 'LOST_OVR',
      connectionReconnecting: () => 'RECONNECT_OVR',
      connectionRestored: () => 'RESTORED_OVR',
      empty: () => 'EMPTY_OVR',
      loading: () => 'LOADING_OVR',
      error: () => 'ERROR_OVR',
    };
    TestBed.configureTestingModule({
      providers: [provideChartI18n(withChartI18nLabels(override))],
    });
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    expect(i18n.empty()).toBe('EMPTY_OVR');
    expect(i18n.valueColumnLabel()).toBe('COL_OVR');
    expect(i18n.connectionLost()).toBe('LOST_OVR');
    expect(i18n.connectionReconnecting()).toBe('RECONNECT_OVR');
    expect(i18n.summary({ trend: 'up', min: 0, max: 0, current: 0, thresholds: [] })).toBe(
      'OVERRIDDEN',
    );
  });

  it('merges a partial override over the English defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideChartI18n(withChartI18nLabels({ empty: () => 'Nix da' }))],
    });
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    expect(i18n.empty()).toBe('Nix da');
    expect(i18n.loading()).toBe('Loading');
    expect(i18n.stackedBarEmpty?.()).toBe('Empty stacked bar');
  });

  it('strips float noise from the stacked-bar summary default', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    const text = i18n.stackedBarSummary?.(6.6000000000000005, [
      { label: 'A', value: 2.2 },
      { label: 'B', value: 4.4000000000000004 },
    ]);
    expect(stripBidiIsolates(text)).toBe('Total 6.6. A: 2.2, B: 4.4.');
  });

  it('returns English defaults for the connection-lifecycle keys', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    expect(i18n.connectionLost()).toBe('Connection lost');
    expect(i18n.connectionReconnecting()).toBe('Reconnecting');
    expect(i18n.connectionRestored()).toBe('Connection restored');
  });

  it('returns the trend-changed string keyed by direction', () => {
    TestBed.configureTestingModule({});
    const i18n = TestBed.inject(CNGX_CHART_I18N)();
    expect(i18n.trendChanged('up')).toBe('Trend changed to up');
    expect(i18n.trendChanged('down')).toBe('Trend changed to down');
    expect(i18n.trendChanged('flat')).toBe('Trend flattened');
  });
});

describe('injectChartI18n', () => {
  const noisy = {
    trend: 'flat',
    min: 1,
    max: 6.6000000000000005,
    current: 2,
    thresholds: [],
  } as const;

  it('keeps a passed key verbatim and formats an omitted summary with LOCALE_ID', () => {
    TestBed.configureTestingModule({
      providers: [
        provideChartI18n(withChartI18nLabels({ dataTable: () => 'Datentabelle' })),
        { provide: LOCALE_ID, useValue: 'de' },
      ],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n());
    expect(i18n().dataTable()).toBe('Datentabelle');
    expect(stripBidiIsolates(i18n().summary(noisy))).toContain('max 6,6');
    expect(stripBidiIsolates(i18n().thresholdAlert(2.5))).toBe('Threshold 2,5 crossed');
  });

  it('formats the token factory default in the root locale', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'de' }] });
    expect(stripBidiIsolates(TestBed.inject(CNGX_CHART_I18N)().summary(noisy))).toContain(
      'max 6,6',
    );
  });

  it('re-formats omitted keys on a CNGX_LOCALE flip, rendered without re-creating the component', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({
      imports: [TableHost],
      providers: [provideLocale(locale)],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n());
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('cngx-chart-data-table') as HTMLElement;
    const cell = (): string =>
      table.querySelector('tbody tr td:last-child')?.textContent?.trim() ?? '';
    expect(stripBidiIsolates(i18n().summary(noisy))).toContain('max 6.6');
    expect(cell()).toBe('6.6');

    locale.set('de-DE');
    fixture.detectChanges();
    expect(stripBidiIsolates(i18n().summary(noisy))).toContain('max 6,6');
    expect(fixture.nativeElement.querySelector('cngx-chart-data-table')).toBe(table);
    expect(cell()).toBe('6,6');
  });

  it('follows a Signal override at runtime and keeps omitted keys on the locale default', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideChartI18n(
          withChartI18nLabels(
            computed(() => (lang() === 'de' ? { empty: () => 'Keine Daten' } : {})),
          ),
        ),
      ],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n());
    expect(i18n().empty()).toBe('No data');

    lang.set('de');
    expect(i18n().empty()).toBe('Keine Daten');
    expect(i18n().loading()).toBe('Loading');
  });

  it('applies withChartI18nLabels on top of the active language pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', chart: { empty: 'Keine Daten', loading: 'Lädt' } }),
          withDocumentLanguage('off'),
        ),
        provideChartI18n(withChartI18nLabels({ empty: () => 'Nichts da' })),
      ],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n())();
    expect(i18n.empty()).toBe('Nichts da');
    expect(i18n.loading()).toBe('Lädt');
  });

  it('resolves a plain override to the same strings as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [provideChartI18n(withChartI18nLabels({ dataTable: () => 'Datentabelle' }))],
    });
    const raw = TestBed.inject(CNGX_CHART_I18N)();
    expect(raw.dataTable()).toBe('Datentabelle');
    expect(raw.valueColumnLabel()).toBe(
      createChartI18nDefaults(CNGX_CHART_LANGUAGE_EN, 'en-US').valueColumnLabel(),
    );
  });

  it('keeps the default bundle reference when a locale flip lands on a cached locale', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({ providers: [provideLocale(locale)] });
    const bundle = TestBed.inject(CNGX_CHART_I18N);
    const english = bundle();

    locale.set('de-DE');
    expect(bundle()).not.toBe(english);

    locale.set('en-US');
    expect(bundle()).toBe(english);
  });

  it('shares one Signal across chart parts under one injector', () => {
    TestBed.configureTestingModule({});
    const first = TestBed.runInInjectionContext(() => injectChartI18n());
    const second = TestBed.runInInjectionContext(() => injectChartI18n());
    expect(first).toBe(second);
  });

  it('keeps the merged reference when a locale flip leaves every key equal', () => {
    const locale = signal('en-US');
    const full: Required<CngxChartI18n> = {
      summary: () => 'S',
      dataTable: () => 'D',
      indexColumnLabel: () => 'I',
      valueColumnLabel: () => 'V',
      trendChanged: () => 'T',
      thresholdAlert: () => 'A',
      connectionLost: () => 'L',
      connectionReconnecting: () => 'R',
      connectionRestored: () => 'O',
      empty: () => 'E',
      loading: () => 'G',
      error: () => 'X',
      stackedBarEmpty: () => 'B',
      stackedBarSummary: () => 'M',
      stackedBarSegmentTitle: () => 'W',
    };
    TestBed.configureTestingModule({
      providers: [provideChartI18n(withChartI18nLabels(full)), provideLocale(locale)],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n());
    const before = i18n();
    locale.set('de-DE');
    expect(i18n()).toBe(before);
  });
});

@Component({
  standalone: true,
  imports: [CngxChartDataTable],
  template: `<cngx-chart-data-table [values]="[6.6000000000000005]" [hidden]="false" />`,
})
class TableHost {}

describe('CNGX_CHART_I18N language pack', () => {
  const summaryInput = { trend: 'down' as const, min: 1.5, max: 9, current: 2, thresholds: [3, 7] };

  it('derives the pre-section English copy from the English section', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('en-US')] });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n())();
    expect(stripBidiIsolates(i18n.summary(summaryInput))).toBe(
      'Trending down. Min 1.5, max 9, current 2. 2 threshold crossings.',
    );
    expect(i18n.dataTable()).toBe('Data table');
    expect(i18n.indexColumnLabel()).toBe('#');
    expect(i18n.valueColumnLabel()).toBe('Value');
    expect(i18n.trendChanged('flat')).toBe('Trend flattened');
    expect(stripBidiIsolates(i18n.thresholdAlert(80))).toBe('Threshold 80 crossed');
    expect(i18n.connectionReconnecting()).toBe('Reconnecting');
    expect(i18n.error()).toBe('Error loading chart');
    expect(i18n.stackedBarEmpty()).toBe('Empty stacked bar');
    expect(stripBidiIsolates(i18n.stackedBarSegmentTitle('A', '2.2'))).toBe('A: 2.2');
  });

  it('gives a route with its own language pack its own words over a shared token value', () => {
    // The same locale signal at root and in the route: only the pack differs.
    const shared = signal('de');
    TestBed.configureTestingModule({ providers: [provideLocale(shared)] });
    const root = TestBed.inject(EnvironmentInjector);
    const route = createEnvironmentInjector(
      [
        provideCngxI18n(
          withPartialPack({ locale: 'de', chart: { dataTable: 'Datentabelle' } }),
          withDocumentLanguage('off'),
        ),
        provideLocale(shared),
      ],
      root,
    );
    const atRoot = TestBed.runInInjectionContext(() => injectChartI18n());
    const inRoute = runInInjectionContext(route, () => injectChartI18n());
    expect(route.get(CNGX_CHART_I18N)).toBe(TestBed.inject(CNGX_CHART_I18N));
    expect(atRoot().dataTable()).toBe('Data table');
    expect(inRoute().dataTable()).toBe('Datentabelle');
    expect(runInInjectionContext(route, () => injectChartI18n())).toBe(inRoute);
    route.destroy();
  });

  it('takes the summary words, order and list separator from the pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n());
    pack.set({
      locale: 'de',
      chart: {
        summary: '{trend}. Minimum {min}; Maximum {max}; aktuell {current}. {thresholds}',
        summaryTrendDown: 'Fallend',
        summaryThresholds: {
          one: 'Ein Schwellenwert gekreuzt.',
          other: '{count} Schwellenwerte gekreuzt.',
        },
        stackedBarSegmentTitle: '{label} {value}',
        listSeparator: '; ',
      },
    });
    expect(stripBidiIsolates(i18n().summary(summaryInput))).toBe(
      'Fallend. Minimum 1,5; Maximum 9; aktuell 2. 2 Schwellenwerte gekreuzt.',
    );
    expect(
      stripBidiIsolates(
        i18n().stackedBarSummary(10, [
          { label: 'A', value: 2.5 },
          { label: 'B', value: 7.5 },
        ]),
      ),
    ).toBe('Total 10. A 2,5; B 7,5.');
    expect(i18n().empty()).toBe('No data');
  });

  it('keeps a provideChartI18n key over the active pack and resolves the rest from it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', chart: { empty: 'Keine Daten', dataTable: 'Tabelle' } }),
          withDocumentLanguage('off'),
        ),
        provideChartI18n(withChartI18nLabels({ dataTable: () => 'Datentabelle' })),
      ],
    });
    const i18n = TestBed.runInInjectionContext(() => injectChartI18n())();
    expect(i18n.dataTable()).toBe('Datentabelle');
    expect(i18n.empty()).toBe('Keine Daten');
  });
});

describe('injectChartI18n in a provideLocaleAt subtree', () => {
  it('formats numbers in the subtree locale while the root stays English', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideLocale('en')] });
    const root = TestBed.runInInjectionContext(() => injectChartI18n());
    const german = runInSubtree([provideLocaleAt('de')], () => injectChartI18n());
    expect(stripBidiIsolates(root().thresholdAlert(12.5))).toBe('Threshold 12.5 crossed');
    expect(stripBidiIsolates(german().thresholdAlert(12.5))).toBe('Threshold 12,5 crossed');
  });
});
