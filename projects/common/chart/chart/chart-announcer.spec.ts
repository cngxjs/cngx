import {
  Component,
  computed,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideLocale } from '@cngx/core/utils';

import { provideChartI18n, withChartI18nLabels } from '../i18n/chart-i18n';
import { CngxChartAnnouncer } from './chart-announcer.component';
import { type CngxChart } from './chart.component';
import { type CngxSignificantChange } from './significant-change';
import { stripBidiIsolates } from '@cngx/testing';

@Component({
  standalone: true,
  imports: [CngxChartAnnouncer],
  template: `<cngx-chart-announcer [cngxChartAnnouncer]="chart" />`,
})
class Host {
  readonly sig = signal<CngxSignificantChange | null>(null);
  readonly chart = { significantChange: this.sig } as unknown as CngxChart;
}

describe('CngxChartAnnouncer', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  function polite(): HTMLElement {
    return host.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
  }
  function assertive(): HTMLElement {
    return host.querySelector('[role="alert"][aria-live="assertive"]') as HTMLElement;
  }

  it('renders both regions, always in DOM and sr-only, empty before any event', () => {
    expect(polite()).not.toBeNull();
    expect(assertive()).not.toBeNull();
    expect(polite().classList.contains('cngx-sr-only')).toBe(true);
    expect(assertive().classList.contains('cngx-sr-only')).toBe(true);
    expect(polite().textContent?.trim()).toBe('');
    expect(assertive().textContent?.trim()).toBe('');
  });

  it('ships the sr-only rule locally so it hides without the global stylesheet', () => {
    // The component's own styles must clip the regions - no dependency on a
    // globally-loaded utilities.css.
    expect(getComputedStyle(polite()).position).toBe('absolute');
    expect(getComputedStyle(assertive()).width).toBe('1px');
  });

  it('voices a trend flip in the polite region only', () => {
    fixture.componentInstance.sig.set({ kind: 'trend-flip', from: 'flat', to: 'up' });
    fixture.detectChanges();
    expect(polite().textContent?.trim()).toBe('Trend changed to up');
    expect(assertive().textContent?.trim()).toBe('');
  });

  it('voices a threshold crossing in the assertive region only', () => {
    fixture.componentInstance.sig.set({ kind: 'threshold-cross', threshold: 80, direction: 'up' });
    fixture.detectChanges();
    expect(stripBidiIsolates(assertive().textContent?.trim())).toBe('Threshold 80 crossed');
    expect(polite().textContent?.trim()).toBe('');
  });

  it('short-circuits an identical event, re-fires a distinct one', () => {
    const de = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxChartAnnouncer,
    );
    const announcer = de.componentInstance as CngxChartAnnouncer;
    const politeText = (announcer as unknown as { politeAnnouncement: () => string })
      .politeAnnouncement;

    const env = TestBed.inject(EnvironmentInjector);
    let runs = 0;
    runInInjectionContext(env, () => {
      effect(() => {
        politeText();
        runs++;
      });
    });
    TestBed.tick();
    const base = runs;

    fixture.componentInstance.sig.set({ kind: 'trend-flip', from: 'flat', to: 'up' });
    TestBed.tick();
    expect(runs).toBe(base + 1);

    // Fresh object, identical text -> no re-fire.
    fixture.componentInstance.sig.set({ kind: 'trend-flip', from: 'flat', to: 'up' });
    TestBed.tick();
    expect(runs).toBe(base + 1);

    // Distinct text -> re-fire.
    fixture.componentInstance.sig.set({ kind: 'trend-flip', from: 'up', to: 'down' });
    TestBed.tick();
    expect(runs).toBe(base + 2);
  });
});

describe('CngxChartAnnouncer - locale flip', () => {
  it('keeps a shown announcement on a CNGX_LOCALE flip and speaks the new locale on the next event', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({ imports: [Host], providers: [provideLocale(locale)] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const assertive = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="alert"][aria-live="assertive"]',
    ) as HTMLElement;
    fixture.componentInstance.sig.set({ kind: 'threshold-cross', threshold: 2.5, direction: 'up' });
    fixture.detectChanges();
    expect(stripBidiIsolates(assertive.textContent?.trim())).toBe('Threshold 2.5 crossed');

    locale.set('de-DE');
    fixture.detectChanges();
    expect(stripBidiIsolates(assertive.textContent?.trim())).toBe('Threshold 2.5 crossed');

    fixture.componentInstance.sig.set({ kind: 'threshold-cross', threshold: 3.5, direction: 'up' });
    fixture.detectChanges();
    expect(stripBidiIsolates(assertive.textContent?.trim())).toBe('Threshold 3,5 crossed');
  });
});

describe('CngxChartAnnouncer - copy flip', () => {
  it('does not re-announce on a language flip', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideChartI18n(
          withChartI18nLabels(
            computed(() =>
              lang() === 'de'
                ? {
                    trendChanged: (t: 'up' | 'down' | 'flat') => `Trend jetzt ${t}`,
                    thresholdAlert: (v: number) => `Schwelle ${v} überschritten`,
                  }
                : {},
            ),
          ),
        ),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const polite = root.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
    const assertive = root.querySelector('[role="alert"][aria-live="assertive"]') as HTMLElement;

    fixture.componentInstance.sig.set({ kind: 'trend-flip', from: 'up', to: 'down' });
    fixture.detectChanges();
    expect(polite.textContent?.trim()).toBe('Trend changed to down');

    lang.set('de');
    fixture.detectChanges();
    expect(polite.textContent?.trim()).toBe('Trend changed to down');

    fixture.componentInstance.sig.set({ kind: 'threshold-cross', threshold: 2, direction: 'up' });
    fixture.detectChanges();
    expect(assertive.textContent?.trim()).toBe('Schwelle 2 überschritten');
  });
});
