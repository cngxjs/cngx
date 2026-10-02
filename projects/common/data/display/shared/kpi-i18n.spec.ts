import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDelta } from '../delta/delta.component';
import { CngxGoal } from '../goal/goal.component';
import { CngxTrend } from '../trend/trend.component';
import {
  CNGX_KPI_I18N,
  injectKpiI18n,
  provideKpiI18n,
  withKpiI18nLabels,
  type CngxKpiI18n,
} from './kpi-i18n';
import { stripBidiIsolates } from '@cngx/testing';

@Component({
  template: `
    <cngx-delta [value]="-2.1" polarity="lower-is-better" [label]="deltaLabel()" />
    <cngx-trend [value]="5.3" />
    <cngx-goal [value]="73" [max]="100" [valueTextFormat]="goalFormat()" />
  `,
  imports: [CngxDelta, CngxTrend, CngxGoal],
})
class Host {
  readonly deltaLabel = signal<string | undefined>(undefined);
  readonly goalFormat = signal<((now: number, max: number) => string) | undefined>(undefined);
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    delta: root.querySelector('cngx-delta')!,
    trend: root.querySelector('cngx-trend')!,
    goal: root.querySelector('cngx-goal')!,
  };
}

describe('CNGX_KPI_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships the English copy without a provider', () => {
    const bundle = TestBed.inject(CNGX_KPI_I18N)();
    expect(stripBidiIsolates(bundle.deltaLabel('+5.3%', 'positive'))).toBe('+5.3% improved');
    expect(stripBidiIsolates(bundle.deltaLabel('2.1%', 'negative'))).toBe('2.1% declined');
    expect(stripBidiIsolates(bundle.deltaLabel('0.0%', 'neutral'))).toBe('0.0% unchanged');
    expect(stripBidiIsolates(bundle.trendLabel('+5.3%', 'up'))).toBe('+5.3% up');
    expect(stripBidiIsolates(bundle.trendLabel('2.1%', 'down'))).toBe('2.1% down');
    expect(stripBidiIsolates(bundle.trendLabel('0.0%', 'flat'))).toBe('0.0% unchanged');
    expect(stripBidiIsolates(bundle.goalValueText(73, 100))).toBe('73 of 100');
  });

  it('renders the English defaults on the KPI atoms', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const { delta, trend, goal } = render();
    expect(stripBidiIsolates(delta.getAttribute('aria-label'))).toBe('2.1% improved');
    expect(stripBidiIsolates(trend.getAttribute('aria-label'))).toBe('+5.3% up');
    expect(stripBidiIsolates(goal.getAttribute('aria-valuetext'))).toBe('73 of 100');
  });

  it('keeps unset keys English on a static partial override', () => {
    TestBed.configureTestingModule({
      providers: [
        provideKpiI18n(withKpiI18nLabels({ goalValueText: (now, max) => `${now} von ${max}` })),
      ],
    });
    const bundle = TestBed.runInInjectionContext(() => injectKpiI18n());
    expect(bundle().goalValueText(1, 2)).toBe('1 von 2');
    expect(stripBidiIsolates(bundle().trendLabel('+1.0%', 'up'))).toBe('+1.0% up');
  });

  it('flips every KPI label live through a Signal override', () => {
    const overrides = signal<Partial<CngxKpiI18n>>({});
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideKpiI18n(withKpiI18nLabels(overrides))],
    });
    const { fixture, delta, trend, goal } = render();
    expect(stripBidiIsolates(trend.getAttribute('aria-label'))).toBe('+5.3% up');

    overrides.set({
      deltaLabel: (formatted, sentiment) =>
        `${formatted} ${sentiment === 'positive' ? 'verbessert' : 'anders'}`,
      trendLabel: (formatted, direction) =>
        `${formatted} ${direction === 'up' ? 'steigend' : 'anders'}`,
      goalValueText: (now, max) => `${now} von ${max}`,
    });
    fixture.detectChanges();
    expect(delta.getAttribute('aria-label')).toBe('2.1% verbessert');
    expect(trend.getAttribute('aria-label')).toBe('+5.3% steigend');
    expect(goal.getAttribute('aria-valuetext')).toBe('73 von 100');
  });

  it('lets the per-instance label and valueTextFormat win over the bundle', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideKpiI18n(
          withKpiI18nLabels({
            deltaLabel: () => 'bundle',
            goalValueText: () => 'bundle',
          }),
        ),
      ],
    });
    const { fixture, delta, goal } = render();
    fixture.componentInstance.deltaLabel.set('Churn fell 2.1%');
    fixture.componentInstance.goalFormat.set((now, max) => `${now}/${max}`);
    fixture.detectChanges();
    expect(delta.getAttribute('aria-label')).toBe('Churn fell 2.1%');
    expect(goal.getAttribute('aria-valuetext')).toBe('73/100');
  });

  it('shares one Signal across readers under one injector', () => {
    TestBed.configureTestingModule({
      providers: [provideKpiI18n(withKpiI18nLabels({ goalValueText: () => 'x' }))],
    });
    const first = TestBed.runInInjectionContext(() => injectKpiI18n());
    const second = TestBed.runInInjectionContext(() => injectKpiI18n());
    expect(first).toBe(second);
  });
});
