import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxMetric } from './metric.component';

@Component({
  template: `<cngx-metric [value]="value()" [unit]="unit()" [format]="format()" />`,
  imports: [CngxMetric],
})
class TestHost {
  value = signal<number | string | null>(1234);
  unit = signal<string | undefined>(undefined);
  format = signal<Intl.NumberFormatOptions | undefined>(undefined);
}

describe('CngxMetric', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-metric');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('displays formatted number', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-metric__value')!.textContent!.trim()).toContain('1,234');
  });

  it('displays em-dash for null', () => {
    const { fixture, el, host } = setup();
    host.value.set(null);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-metric__value')!.textContent!.trim()).toBe('\u2014');
  });

  it('displays string value as-is', () => {
    const { fixture, el, host } = setup();
    host.value.set('n.b.');
    fixture.detectChanges();
    expect(el.querySelector('.cngx-metric__value')!.textContent!.trim()).toBe('n.b.');
  });

  it('displays unit', () => {
    const { fixture, el, host } = setup();
    host.unit.set('bpm');
    fixture.detectChanges();
    expect(el.querySelector('.cngx-metric__unit')!.textContent!.trim()).toBe('bpm');
  });

  it('hides unit when undefined', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-metric__unit')).toBeFalsy();
  });

  it('uses Intl.NumberFormat with format options', () => {
    const { fixture, el, host } = setup();
    host.value.set(99.567);
    host.format.set({ maximumFractionDigits: 1 });
    fixture.detectChanges();
    expect(el.querySelector('.cngx-metric__value')!.textContent!.trim()).toContain('99.6');
  });

  it('sets aria-label with value and unit', () => {
    const { fixture, el, host } = setup();
    host.unit.set('bpm');
    fixture.detectChanges();
    expect(el.getAttribute('aria-label')).toContain('1,234');
    expect(el.getAttribute('aria-label')).toContain('bpm');
  });
});
