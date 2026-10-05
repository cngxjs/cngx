import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { CNGX_LOCALE } from '@cngx/core/utils';
import { CngxCardTimestamp } from './card-timestamp.component';
import { provideCardI18n, withCardI18nLabels } from './i18n/card-i18n';

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

  it('renders the prefix before the date in English', () => {
    const { fixture, el, host } = setup();
    host.prefix.set('Evaluated:');
    fixture.detectChanges();
    expect(Array.from(el.children, (child) => child.localName)).toEqual(['span', 'time']);
    expect(el.textContent!.replace(/\s+/g, ' ').trim()).toBe('Evaluated: 03/15/2026');
  });

  it('orders the prefix and the date by the timestamp message, with its text', () => {
    TestBed.configureTestingModule({
      providers: [provideCardI18n(withCardI18nLabels({ timestamp: '{date} · {prefix}' }))],
    });
    const { fixture, el, host } = setup();
    host.prefix.set('evaluated');
    fixture.detectChanges();
    expect(Array.from(el.children, (child) => child.localName)).toEqual(['time', 'span']);
    expect(el.textContent!.replace(/\s+/g, '')).toBe('03/15/2026·evaluated');
  });

  it('renders only the date and no message text without a prefix', () => {
    TestBed.configureTestingModule({
      providers: [provideCardI18n(withCardI18nLabels({ timestamp: 'on {date} ({prefix})' }))],
    });
    const { el } = setup();
    expect(el.textContent!.trim()).toBe('03/15/2026');
  });

  it('keeps the segments when a different prefix needs the same layout', () => {
    const { fixture, host } = setup();
    const timestamp = fixture.debugElement.children[0].componentInstance as CngxCardTimestamp;
    host.prefix.set('Evaluated:');
    fixture.detectChanges();
    const first = timestamp['segments']();
    host.prefix.set('Updated:');
    fixture.detectChanges();
    expect(timestamp['segments']()).toBe(first);
  });

  it('re-orders on a language pack switch', () => {
    const pack = signal<{ locale: string; card?: { timestamp: string } } | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const { fixture, el, host } = setup();
    host.prefix.set('Stand');
    fixture.detectChanges();
    expect(el.firstElementChild!.localName).toBe('span');

    pack.set({ locale: 'en-US', card: { timestamp: '{date} {prefix}' } });
    fixture.detectChanges();
    expect(Array.from(el.children, (child) => child.localName)).toEqual(['time', 'span']);
  });

  it('renders empty, drops datetime, and dev-warns on an Invalid Date', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, el, host } = setup();
    host.date.set('not-a-date');
    fixture.detectChanges();
    const time = el.querySelector('time')!;
    expect(time.textContent!.trim()).toBe('');
    expect(time.hasAttribute('datetime')).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('dedupes Invalid Date pairs (single dev-warn across rebinds)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, host } = setup();
    host.date.set('not-a-date');
    fixture.detectChanges();
    host.date.set('also-not-a-date');
    fixture.detectChanges();
    // The NaN-aware equal dedupes the second invalid instant - the
    // dev-warn effect refires only when the instant actually changes.
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('accepts ISO string date', () => {
    const { fixture, el, host } = setup();
    host.date.set('2025-12-25');
    fixture.detectChanges();
    expect(el.querySelector('time')!.textContent!.trim()).toContain('12/25/2025');
  });
});

describe('CngxCardTimestamp - CNGX_LOCALE', () => {
  it('re-formats on a locale flip without re-creating the component', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: CNGX_LOCALE, useValue: locale.asReadonly() }],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const time: HTMLTimeElement = fixture.nativeElement.querySelector('time');
    expect(time.textContent!.trim()).toContain('03/15/2026');

    locale.set('de-DE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('time')).toBe(time);
    expect(time.textContent!.trim()).toContain('15.03.2026');
  });
});
