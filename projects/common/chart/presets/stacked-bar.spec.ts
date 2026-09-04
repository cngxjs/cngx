import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideChartI18n, type CngxChartI18n } from '../i18n/chart-i18n';
import { CngxStackedBar, type CngxStackedSegment } from './stacked-bar.component';

@Component({
  standalone: true,
  imports: [CngxStackedBar],
  template: ` <cngx-stacked-bar [segments]="segments()" [total]="total()" data-testid="bar" /> `,
})
class TestHost {
  segments = signal<readonly CngxStackedSegment[]>([
    { value: 25, label: 'A', color: '#a' },
    { value: 50, label: 'B', color: '#b' },
    { value: 25, label: 'C', color: '#c' },
  ]);
  total = signal<number | null>(null);
}

describe('CngxStackedBar', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    return { fixture, host };
  }

  it('renders one segment per [segments] entry', () => {
    const { host } = setup();
    const segs = host.querySelectorAll('.cngx-stacked-bar__segment');
    expect(segs.length).toBe(3);
  });

  it('lays out segments in proportional widths summing to 100% of the track', () => {
    const { host } = setup();
    const segs = Array.from(host.querySelectorAll<HTMLElement>('.cngx-stacked-bar__segment'));
    const widths = segs.map((s) => parseFloat(s.style.width));
    expect(widths).toEqual([25, 50, 25]);
  });

  it('honours an explicit [total] over the segment-sum default', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.total.set(200);
    fixture.detectChanges();
    const segs = Array.from(host.querySelectorAll<HTMLElement>('.cngx-stacked-bar__segment'));
    const widths = segs.map((s) => parseFloat(s.style.width));
    expect(widths).toEqual([12.5, 25, 12.5]);
  });

  it('builds an aria-label that enumerates segments and total', () => {
    const { host } = setup();
    const label = host.getAttribute('aria-label') ?? '';
    expect(label).toContain('Total 100');
    expect(label).toContain('A: 25');
    expect(label).toContain('B: 50');
    expect(label).toContain('C: 25');
  });

  const OVERRIDE_BASE: CngxChartI18n = {
    summary: () => 'summary',
    dataTable: () => 'table',
    valueColumnLabel: () => 'value',
    trendChanged: () => 'trend',
    thresholdAlert: () => 'threshold',
    connectionLost: () => 'lost',
    connectionReconnecting: () => 'reconnecting',
    connectionRestored: () => 'restored',
    empty: () => 'empty',
    loading: () => 'loading',
    error: () => 'error',
  };

  it('routes the auto-generated aria-label through CNGX_CHART_I18N overrides', () => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideChartI18n({
          ...OVERRIDE_BASE,
          stackedBarEmpty: () => 'Leer',
          stackedBarSummary: (total, segments) => `Gesamt ${total} (${segments.length} Segmente)`,
        }),
      ],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Gesamt 100 (3 Segmente)');
    fixture.componentInstance.segments.set([]);
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Leer');
  });

  it('falls back to the built-in phrasing when an override omits the optional stacked-bar keys', () => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideChartI18n(OVERRIDE_BASE)],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Total 100. A: 25, B: 50, C: 25.');
    fixture.componentInstance.segments.set([]);
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Empty stacked bar');
  });
  it('names the host from the state view while a fallback shows, not from the segments', async () => {
    const { createManualState } = await import('@cngx/common/data');
    @Component({
      standalone: true,
      imports: [CngxStackedBar],
      template: `<cngx-stacked-bar [segments]="[]" [state]="state" data-testid="bar" />`,
    })
    class StateHost {
      readonly state = createManualState<readonly CngxStackedSegment[]>();
    }
    TestBed.configureTestingModule({ imports: [StateHost] });
    const fixture = TestBed.createComponent(StateHost);
    fixture.componentInstance.state.set('loading');
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    // Without the view gate this would read "Empty stacked bar" while
    // aria-busy announces a load in flight.
    expect(host.getAttribute('aria-label')).toBe('Loading');
    expect(host.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.state.setError(new Error('feed down'));
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Error loading chart');
  });
});
