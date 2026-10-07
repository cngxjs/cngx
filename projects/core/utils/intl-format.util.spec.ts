import { describe, expect, it } from 'vitest';
import {
  dateTimeFormatterFor,
  displayFormattersFor,
  formatDisplayValue,
  numberFormatterFor,
} from './intl-format.util';

describe('dateTimeFormatterFor', () => {
  it('returns the same formatter instance for equal locale + options', () => {
    const a = dateTimeFormatterFor('en-US', { year: 'numeric', month: 'short' });
    const b = dateTimeFormatterFor('en-US', { year: 'numeric', month: 'short' });
    expect(a).toBe(b);
  });

  it('returns distinct formatters per locale and per options', () => {
    const base = dateTimeFormatterFor('en-US', { month: 'short' });
    expect(dateTimeFormatterFor('de-AT', { month: 'short' })).not.toBe(base);
    expect(dateTimeFormatterFor('en-US', { month: 'long' })).not.toBe(base);
  });

  it('formats correctly across more option variants than the cache holds', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const months = ['numeric', '2-digit', 'long', 'short'] as const;
    const days = ['numeric', '2-digit'] as const;
    const years = ['numeric', '2-digit'] as const;
    const eras = [undefined, 'short', 'long'] as const;
    const combo = (i: number): Intl.DateTimeFormatOptions => ({
      month: months[i % 4],
      day: days[Math.floor(i / 4) % 2],
      year: years[Math.floor(i / 8) % 2],
      era: eras[Math.floor(i / 16) % 3],
    });
    // 40 distinct combos overflow the bounded cache; eviction must never
    // change the output, including for evicted-then-recreated entries.
    for (let i = 0; i < 40; i++) {
      expect(dateTimeFormatterFor('en-US', combo(i)).format(date)).toBe(
        new Intl.DateTimeFormat('en-US', combo(i)).format(date),
      );
    }
    expect(dateTimeFormatterFor('en-US', combo(0)).format(date)).toBe(
      new Intl.DateTimeFormat('en-US', combo(0)).format(date),
    );
  });
});

describe('numberFormatterFor', () => {
  it('returns the same formatter instance for equal locale + options', () => {
    const a = numberFormatterFor('en-US', { style: 'percent' });
    const b = numberFormatterFor('en-US', { style: 'percent' });
    expect(a).toBe(b);
  });

  it('returns a second instance for a second locale', () => {
    const en = numberFormatterFor('en-US', { style: 'percent' });
    const de = numberFormatterFor('de-DE', { style: 'percent' });
    expect(de).not.toBe(en);
    expect(de.format(0.42)).toBe(new Intl.NumberFormat('de-DE', { style: 'percent' }).format(0.42));
  });
});

describe('formatDisplayValue', () => {
  it('formats a number and a date for the locale, dates date-only', () => {
    const date = new Date(2026, 9, 7, 13, 30);
    expect(formatDisplayValue(1234.5, displayFormattersFor('en'))).toBe('1,234.5');
    expect(formatDisplayValue(1234.5, displayFormattersFor('de'))).toBe('1.234,5');
    expect(formatDisplayValue(date, displayFormattersFor('en'))).toBe('Oct 7, 2026');
    expect(formatDisplayValue(date, displayFormattersFor('de'))).toBe('7. Okt. 2026');
  });

  it('renders an invalid date empty and passes every other value through', () => {
    const en = displayFormattersFor('en');
    const item = { id: 1 };
    expect(formatDisplayValue(new Date(Number.NaN), en)).toBe('');
    expect(formatDisplayValue('text', en)).toBe('text');
    expect(formatDisplayValue(true, en)).toBe(true);
    expect(formatDisplayValue(null, en)).toBeNull();
    expect(formatDisplayValue(item, en)).toBe(item);
  });

  it('applies custom date and number formats', () => {
    const custom = displayFormattersFor(
      'de',
      { dateStyle: 'medium' },
      { minimumFractionDigits: 2 },
    );
    expect(formatDisplayValue(1.5, custom)).toBe('1,50');
  });

  it('reuses the cached formatters for the same locale and formats', () => {
    const first = displayFormattersFor('de', { dateStyle: 'medium' });
    const second = displayFormattersFor('de', { dateStyle: 'medium' });
    expect(second.number).toBe(first.number);
    expect(second.date).toBe(first.date);
    expect(displayFormattersFor('en').date).not.toBe(displayFormattersFor('de').date);
  });
});
