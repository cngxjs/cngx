import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCardTimestamp } from './card-timestamp.component';

@Component({
  template: `<cngx-card-timestamp [date]="date()" [prefix]="prefix()" />`,
  imports: [CngxCardTimestamp],
})
class TestHost {
  date = signal<Date | string>(new Date('2026-03-15'));
  prefix = signal<string | undefined>(undefined);
}

describe('CngxCardTimestamp', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-card-timestamp');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('displays formatted date', () => {
    const { el } = setup();
    const time = el.querySelector('time')!;
    expect(time.textContent!.trim()).toContain('03/15/2026');
  });

  it('sets datetime attribute as ISO string', () => {
    const { el } = setup();
    const time = el.querySelector('time')!;
    expect(time.getAttribute('datetime')).toContain('2026-03-15');
  });

  it('displays prefix when provided', () => {
    const { fixture, el, host } = setup();
    host.prefix.set('Evaluierung am:');
    fixture.detectChanges();
    expect(el.querySelector('.cngx-card-timestamp__prefix')!.textContent!.trim()).toBe(
      'Evaluierung am:',
    );
  });

  it('hides prefix when not provided', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-card-timestamp__prefix')).toBeFalsy();
  });

  it('accepts ISO string date', () => {
    const { fixture, el, host } = setup();
    host.date.set('2025-12-25');
    fixture.detectChanges();
    expect(el.querySelector('time')!.textContent!.trim()).toContain('12/25/2025');
  });
});
