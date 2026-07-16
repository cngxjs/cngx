import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxMetric } from '../metric/metric.component';
import { CngxDelta } from '../delta/delta.component';
import { CngxStat } from './stat.component';
import {
  CngxStatCaption,
  CngxStatDelta,
  CngxStatLabel,
  CngxStatValue,
} from './stat-slots';

@Component({
  template: `
    <cngx-stat [live]="live()">
      @if (showLabel()) {
        <span cngxStatLabel>Revenue</span>
      }
      <cngx-metric cngxStatValue [value]="1.2" unit="M" />
      @if (showDelta()) {
        <cngx-delta cngxStatDelta [value]="5.3" />
      }
      <span cngxStatCaption>vs last quarter</span>
    </cngx-stat>
  `,
  imports: [CngxStat, CngxStatLabel, CngxStatValue, CngxStatDelta, CngxStatCaption, CngxMetric, CngxDelta],
})
class TestHost {
  live = signal<'off' | 'polite' | 'assertive'>('off');
  showLabel = signal(true);
  showDelta = signal(true);
}

describe('CngxStat', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const stat: HTMLElement = fixture.nativeElement.querySelector('cngx-stat');
    return { fixture, stat, host: fixture.componentInstance };
  }

  function labelledIds(stat: HTMLElement): string[] {
    return (stat.getAttribute('aria-labelledby') ?? '').split(' ').filter(Boolean);
  }

  it('lists exactly the present slots in reading order', () => {
    const { stat } = setup();
    const expected = [
      stat.querySelector('[cngxStatLabel]')!.id,
      stat.querySelector('[cngxStatValue]')!.id,
      stat.querySelector('[cngxStatDelta]')!.id,
      stat.querySelector('[cngxStatCaption]')!.id,
    ];
    expect(labelledIds(stat)).toEqual(expected);
    expect(expected.every(Boolean)).toBe(true);
  });

  it('omits an absent slot but keeps the reading order of the rest', () => {
    const { fixture, stat, host } = setup();
    host.showDelta.set(false);
    fixture.detectChanges();
    const expected = [
      stat.querySelector('[cngxStatLabel]')!.id,
      stat.querySelector('[cngxStatValue]')!.id,
      stat.querySelector('[cngxStatCaption]')!.id,
    ];
    expect(stat.querySelector('[cngxStatDelta]')).toBeNull();
    expect(labelledIds(stat)).toEqual(expected);
  });

  it('reorders correctly when the leading slot is absent', () => {
    const { fixture, stat, host } = setup();
    host.showLabel.set(false);
    fixture.detectChanges();
    const ids = labelledIds(stat);
    expect(ids[0]).toBe(stat.querySelector('[cngxStatValue]')!.id);
    expect(stat.querySelector('[cngxStatLabel]')).toBeNull();
  });

  it('reflects aria-live from the input', () => {
    const { fixture, stat, host } = setup();
    expect(stat.getAttribute('aria-live')).toBe('off');
    host.live.set('polite');
    fixture.detectChanges();
    expect(stat.getAttribute('aria-live')).toBe('polite');
  });

  it('keeps aria-labelledby unchanged across an unrelated re-render (id set stable)', () => {
    const { fixture, stat, host } = setup();
    const before = stat.getAttribute('aria-labelledby');
    // Flip an unrelated input; the slot set does not change, so the derived
    // accessible name must not churn.
    host.live.set('assertive');
    fixture.detectChanges();
    expect(stat.getAttribute('aria-labelledby')).toBe(before);
    expect(before).not.toBeNull();
  });
});
