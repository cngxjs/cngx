import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTime } from './time.component';

function make(date: Date | string | number, inputs: { mode?: 'absolute' | 'relative'; format?: Intl.DateTimeFormatOptions } = {}) {
  const fixture = TestBed.createComponent(CngxTime);
  fixture.componentRef.setInput('date', date);
  if (inputs.mode) {
    fixture.componentRef.setInput('mode', inputs.mode);
  }
  if (inputs.format) {
    fixture.componentRef.setInput('format', inputs.format);
  }
  fixture.detectChanges();
  const timeEl = (fixture.nativeElement as HTMLElement).querySelector('time') as HTMLTimeElement;
  return { fixture, timeEl };
}

describe('CngxTime', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'en-US' }] }));

  it('formats an absolute date via Intl.DateTimeFormat with the default options', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const { timeEl } = make(date);
    const expected = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
    expect(timeEl.textContent?.trim()).toBe(expected);
  });

  it('honours an explicit format in absolute mode', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const { timeEl } = make(date, { format: { dateStyle: 'long' } });
    const expected = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
    expect(timeEl.textContent?.trim()).toBe(expected);
  });

  it('writes the ISO 8601 instant into the datetime attribute', () => {
    const { timeEl } = make(new Date('2026-03-15T12:00:00Z'));
    expect(timeEl.getAttribute('datetime')).toBe('2026-03-15T12:00:00.000Z');
  });

  it('coerces an ISO string input', () => {
    const iso = '2026-03-15T12:00:00.000Z';
    const { timeEl } = make(iso);
    expect(timeEl.getAttribute('datetime')).toBe(iso);
  });

  it('coerces an epoch-ms number input', () => {
    const epoch = Date.UTC(2026, 2, 15, 12, 0, 0);
    const { timeEl } = make(epoch);
    expect(timeEl.getAttribute('datetime')).toBe(new Date(epoch).toISOString());
  });

  it('formats a past instant in relative mode (hours bucket)', () => {
    const { timeEl } = make(new Date(Date.now() - 3 * 60 * 60 * 1000), { mode: 'relative' });
    expect(timeEl.textContent?.trim()).toBe('3 hours ago');
  });

  it('formats a past instant in relative mode (days bucket)', () => {
    const { timeEl } = make(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), { mode: 'relative' });
    expect(timeEl.textContent?.trim()).toBe('2 days ago');
  });

  it('formats a future instant in relative mode (minutes bucket)', () => {
    const { timeEl } = make(new Date(Date.now() + 5 * 60 * 1000), { mode: 'relative' });
    expect(timeEl.textContent?.trim()).toBe('in 5 minutes');
  });

  it('formats a distant past instant in relative mode (years bucket)', () => {
    const { timeEl } = make(new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), { mode: 'relative' });
    expect(timeEl.textContent?.trim()).toBe('3 years ago');
  });

  it('renders a stable instant when [date] switches between equal representations', () => {
    const fixture = TestBed.createComponent(CngxTime);
    fixture.componentRef.setInput('date', new Date('2026-03-15T12:00:00Z'));
    fixture.detectChanges();
    const timeEl = (fixture.nativeElement as HTMLElement).querySelector('time') as HTMLTimeElement;
    const iso = timeEl.getAttribute('datetime');

    // A fresh Date of the same instant, then the equivalent ISO string: the
    // instant computed's time-value equal fn keeps the rendered output stable.
    fixture.componentRef.setInput('date', new Date('2026-03-15T12:00:00Z'));
    fixture.detectChanges();
    expect(timeEl.getAttribute('datetime')).toBe(iso);

    fixture.componentRef.setInput('date', '2026-03-15T12:00:00.000Z');
    fixture.detectChanges();
    expect(timeEl.getAttribute('datetime')).toBe(iso);
  });
});
